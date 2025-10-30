// Sistema de tratamento de erros robusto
export class NetworkError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class AbortError extends Error {
  constructor(message: string = 'Operação cancelada') {
    super(message);
    this.name = 'AbortError';
  }
}

// Função para fazer fetch com retry e tratamento de erros
export async function robustFetch(
  url: string, 
  options: RequestInit = {},
  maxRetries: number = 2
): Promise<Response> {
  // Validar URL
  if (!url || url === 'undefined' || url === 'null') {
    throw new NetworkError('URL inválida fornecida');
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);
      return response;

    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error as Error;

      // Se é AbortError, não fazer retry
      if (lastError.name === 'AbortError') {
        console.warn(`Requisição cancelada (tentativa ${attempt + 1}):`, url);
        
        // Se não é a última tentativa, aguardar antes de tentar novamente
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        
        throw new AbortError('Requisição cancelada após múltiplas tentativas');
      }

      // Para outros erros, aguardar antes do retry
      if (attempt < maxRetries) {
        console.warn(`Erro na tentativa ${attempt + 1}, tentando novamente:`, lastError.message);
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
    }
  }

  // Se chegou aqui, todas as tentativas falharam
  throw new NetworkError(
    `Falha na conexão após ${maxRetries + 1} tentativas: ${lastError?.message}`,
    'NETWORK_FAILURE'
  );
}

// Hook para lidar com erros de forma consistente
export function handleApiError(error: unknown): string {
  if (error instanceof AbortError) {
    return 'Operação cancelada. Tente novamente.';
  }
  
  if (error instanceof NetworkError) {
    if (error.code === 'NETWORK_FAILURE') {
      return 'Problema de conexão. Verifique sua internet e tente novamente.';
    }
    return error.message;
  }
  
  if (error instanceof Error) {
    // Erros específicos do Supabase
    if (error.message.includes('table')) {
      return 'Banco de dados não configurado. Configure o Supabase primeiro.';
    }
    
    if (error.message.includes('PGRST')) {
      return 'Erro no banco de dados. Tente novamente em alguns instantes.';
    }
    
    return error.message;
  }
  
  return 'Erro inesperado. Tente novamente.';
}

// Função para log estruturado de erros
export function logError(error: unknown, context: string, metadata?: Record<string, any>) {
  const errorInfo = {
    context,
    timestamp: new Date().toISOString(),
    error: {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    },
    metadata,
  };
  
  console.error('Error logged:', errorInfo);
  
  // Em produção, aqui você enviaria para um serviço de monitoramento
  // como Sentry, LogRocket, etc.
}