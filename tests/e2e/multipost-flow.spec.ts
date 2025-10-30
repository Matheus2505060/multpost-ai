import { test, expect } from '@playwright/test';

test.describe('MultiPost AI - Fluxo Completo', () => {
  test.beforeEach(async ({ page }) => {
    // Configurar modo sandbox
    await page.addInitScript(() => {
      window.localStorage.setItem('SANDBOX_MODE', 'true');
    });
  });

  test('Deve completar fluxo de cadastro e login', async ({ page }) => {
    // Ir para página de cadastro
    await page.goto('/signup');
    
    // Preencher formulário de cadastro
    await page.fill('[data-testid="name-input"]', 'Usuário Teste');
    await page.fill('[data-testid="email-input"]', 'teste@example.com');
    await page.fill('[data-testid="password-input"]', 'senha123');
    
    // Submeter cadastro
    await page.click('[data-testid="signup-button"]');
    
    // Verificar redirecionamento ou mensagem de sucesso
    await expect(page).toHaveURL(/\/login|\/dashboard/);
    
    // Se redirecionou para login, fazer login
    if (page.url().includes('/login')) {
      await page.fill('[data-testid="email-input"]', 'teste@example.com');
      await page.fill('[data-testid="password-input"]', 'senha123');
      await page.click('[data-testid="login-button"]');
    }
    
    // Verificar se chegou no dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Painel de Publicação');
  });

  test('Deve fazer upload de vídeo e configurar publicação', async ({ page }) => {
    // Fazer login primeiro (assumindo usuário já existe)
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'teste@example.com');
    await page.fill('[data-testid="password-input"]', 'senha123');
    await page.click('[data-testid="login-button"]');
    
    await expect(page).toHaveURL('/dashboard');
    
    // Ir para aba de publicação
    await page.click('[data-testid="publish-tab"]');
    
    // Simular upload de arquivo
    const fileInput = page.locator('#video-upload');
    await fileInput.setInputFiles({
      name: 'test-video.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.from('fake video content')
    });
    
    // Aguardar upload completar
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 10000 });
    
    // Preencher detalhes do conteúdo
    await page.fill('[data-testid="title-input"]', 'Vídeo de Teste E2E');
    await page.fill('[data-testid="description-input"]', 'Descrição do vídeo de teste #teste #e2e');
    
    // Verificar plataformas conectadas
    await expect(page.locator('[data-testid="platform-tiktok"]')).toBeVisible();
    await expect(page.locator('[data-testid="platform-youtube"]')).toBeVisible();
    
    // Selecionar plataformas
    await page.click('[data-testid="platform-tiktok"]');
    await page.click('[data-testid="platform-youtube"]');
    
    // Verificar se botão de publicar está habilitado
    await expect(page.locator('[data-testid="publish-now-button"]')).toBeEnabled();
  });

  test('Deve publicar imediatamente', async ({ page }) => {
    // Setup inicial (login + upload)
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'teste@example.com');
    await page.fill('[data-testid="password-input"]', 'senha123');
    await page.click('[data-testid="login-button"]');
    
    await page.goto('/dashboard');
    
    // Upload rápido
    const fileInput = page.locator('#video-upload');
    await fileInput.setInputFiles({
      name: 'test-video.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.from('fake video content')
    });
    
    await page.fill('[data-testid="title-input"]', 'Publicação Imediata');
    await page.fill('[data-testid="description-input"]', 'Teste de publicação imediata');
    
    // Selecionar plataformas
    await page.click('[data-testid="platform-tiktok"]');
    
    // Publicar agora
    await page.click('[data-testid="publish-now-button"]');
    
    // Verificar feedback de publicação
    await expect(page.locator('[data-testid="publishing-status"]')).toContainText('Publicando...');
    
    // Aguardar conclusão (timeout maior para simular API)
    await expect(page.locator('[data-testid="publish-success"]')).toBeVisible({ timeout: 15000 });
  });

  test('Deve agendar publicação', async ({ page }) => {
    // Setup inicial
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'teste@example.com');
    await page.fill('[data-testid="password-input"]', 'senha123');
    await page.click('[data-testid="login-button"]');
    
    await page.goto('/dashboard');
    
    // Upload e configuração
    const fileInput = page.locator('#video-upload');
    await fileInput.setInputFiles({
      name: 'scheduled-video.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.from('fake video content')
    });
    
    await page.fill('[data-testid="title-input"]', 'Vídeo Agendado');
    await page.fill('[data-testid="description-input"]', 'Teste de agendamento');
    
    // Selecionar modo agendamento
    await page.click('[data-testid="schedule-radio"]');
    
    // Configurar data e hora (amanhã)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    
    await page.fill('[data-testid="schedule-date"]', dateString);
    await page.fill('[data-testid="schedule-time"]', '14:30');
    
    // Selecionar plataformas
    await page.click('[data-testid="platform-youtube"]');
    
    // Agendar
    await page.click('[data-testid="schedule-button"]');
    
    // Verificar sucesso
    await expect(page.locator('[data-testid="schedule-success"]')).toBeVisible({ timeout: 10000 });
  });

  test('Deve exibir histórico atualizado', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'teste@example.com');
    await page.fill('[data-testid="password-input"]', 'senha123');
    await page.click('[data-testid="login-button"]');
    
    await page.goto('/dashboard');
    
    // Ir para aba histórico
    await page.click('[data-testid="history-tab"]');
    
    // Verificar se histórico carrega
    await expect(page.locator('[data-testid="history-list"]')).toBeVisible();
    
    // Verificar se há publicações (pode estar vazio em teste limpo)
    const publications = page.locator('[data-testid="publication-item"]');
    const count = await publications.count();
    
    if (count > 0) {
      // Verificar elementos da primeira publicação
      const firstPublication = publications.first();
      await expect(firstPublication.locator('[data-testid="publication-title"]')).toBeVisible();
      await expect(firstPublication.locator('[data-testid="publication-status"]')).toBeVisible();
      await expect(firstPublication.locator('[data-testid="publication-platforms"]')).toBeVisible();
    }
  });

  test('Deve exibir analytics básicas', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'teste@example.com');
    await page.fill('[data-testid="password-input"]', 'senha123');
    await page.click('[data-testid="login-button"]');
    
    await page.goto('/dashboard');
    
    // Ir para aba analytics
    await page.click('[data-testid="analytics-tab"]');
    
    // Verificar cards de métricas
    await expect(page.locator('[data-testid="metric-videos"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-reach"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-engagement"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-time-saved"]')).toBeVisible();
    
    // Verificar desempenho por plataforma
    await expect(page.locator('[data-testid="platform-performance"]')).toBeVisible();
  });

  test('Deve funcionar responsivamente em mobile', async ({ page }) => {
    // Configurar viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'teste@example.com');
    await page.fill('[data-testid="password-input"]', 'senha123');
    await page.click('[data-testid="login-button"]');
    
    await page.goto('/dashboard');
    
    // Verificar se interface mobile funciona
    await expect(page.locator('h1')).toBeVisible();
    
    // Testar navegação por abas
    await page.click('[data-testid="publish-tab"]');
    await expect(page.locator('[data-testid="upload-section"]')).toBeVisible();
    
    await page.click('[data-testid="history-tab"]');
    await expect(page.locator('[data-testid="history-list"]')).toBeVisible();
    
    // Verificar se elementos se adaptam ao mobile
    const uploadCard = page.locator('[data-testid="upload-card"]');
    await expect(uploadCard).toBeVisible();
  });
});