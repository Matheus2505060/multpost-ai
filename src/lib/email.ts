import nodemailer from 'nodemailer';

// Configuração do transporter de email
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Função para enviar email de verificação
export const sendVerificationEmail = async (email: string, userId: string, token: string) => {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?id=${userId}&token=${token}`;
  
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Verifique seu email - MultiPost AI',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #333;">Bem-vindo ao MultiPost AI!</h2>
        <p>Para completar seu cadastro, clique no link abaixo para verificar seu email:</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Verificar Email
        </a>
        <p>Se você não criou uma conta, ignore este email.</p>
        <p>Este link expira em 24 horas.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Erro ao enviar email de verificação:', error);
    return false;
  }
};

// Função para enviar email de reset de senha
export const sendPasswordResetEmail = async (email: string, userId: string, token: string) => {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?id=${userId}&token=${token}`;
  
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Redefinir senha - MultiPost AI',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #333;">Redefinir sua senha</h2>
        <p>Você solicitou a redefinição de sua senha. Clique no link abaixo para criar uma nova senha:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Redefinir Senha
        </a>
        <p>Se você não solicitou esta redefinição, ignore este email.</p>
        <p>Este link expira em 1 hora.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Erro ao enviar email de reset:', error);
    return false;
  }
};