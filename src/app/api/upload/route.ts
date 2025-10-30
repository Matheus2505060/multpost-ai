import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Verificar se é multipart/form-data
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Content-Type deve ser multipart/form-data' }, { status: 400 });
    }

    // Processar form data
    const formData = await request.formData();
    const file = formData.get('video') as File;

    if (!file) {
      return NextResponse.json({ error: 'Arquivo de vídeo é obrigatório' }, { status: 400 });
    }

    // Validações básicas
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'Arquivo muito grande. Máximo 500MB permitido' 
      }, { status: 400 });
    }

    // Verificar tipo de arquivo
    const allowedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Tipo de arquivo não suportado. Use MP4, MOV ou AVI' 
      }, { status: 400 });
    }

    // Ler arquivo para análise
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Analisar metadados do vídeo (implementação simplificada)
    const videoMeta = await analyzeVideoMetadata(buffer, file);

    // Salvar arquivo temporariamente (em produção, usar storage real)
    const filename = `${Date.now()}_${file.name}`;
    const filePath = await saveUploadFile(buffer, filename);

    // Salvar registro no banco
    const { data: upload, error } = await supabase
      .from('uploads')
      .insert([
        {
          user_id: decoded.userId,
          filename: file.name,
          path: filePath,
          duration: videoMeta.duration,
          width: videoMeta.width,
          height: videoMeta.height,
          size_bytes: file.size,
          mime_type: file.type
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar upload:', error);
      return NextResponse.json({ error: 'Erro ao salvar upload' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Upload realizado com sucesso',
      upload: {
        id: upload.id,
        filename: upload.filename,
        duration: upload.duration,
        width: upload.width,
        height: upload.height,
        size: upload.size_bytes,
        aspectRatio: upload.width && upload.height ? upload.width / upload.height : null
      }
    });

  } catch (error) {
    console.error('Erro no upload:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Função para analisar metadados do vídeo
async function analyzeVideoMetadata(buffer: Buffer, file: File) {
  // Em produção, usar biblioteca como ffprobe ou similar
  // Por enquanto, retornar valores estimados baseados no arquivo
  
  // Estimativas baseadas no tamanho e tipo do arquivo
  const estimatedDuration = Math.min(Math.max(file.size / (1024 * 1024) * 10, 10), 180); // 10-180 segundos
  
  return {
    duration: Math.round(estimatedDuration),
    width: 720, // Assumir resolução padrão
    height: 1280,
    aspectRatio: 720 / 1280
  };
}

// Função para salvar arquivo
async function saveUploadFile(buffer: Buffer, filename: string): Promise<string> {
  // Em produção, salvar no Supabase Storage, AWS S3, etc.
  // Por enquanto, simular salvamento
  
  const path = `uploads/${filename}`;
  
  // Aqui você salvaria o arquivo real:
  // await supabase.storage.from('videos').upload(path, buffer);
  
  return path;
}