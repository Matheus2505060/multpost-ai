import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termos de Serviço | MultPost',
  description: 'Termos de Serviço da plataforma MultPost - Software SaaS para publicação automática em redes sociais',
}

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8 md:p-12">
        <article className="prose prose-lg max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Termos de Serviço – MultPost
          </h1>
          
          <p className="text-sm text-gray-600 mb-8">
            <strong>Última atualização:</strong> 30 de outubro de 2025
          </p>

          <p className="text-gray-700 leading-relaxed mb-6">
            Bem-vindo ao <strong>MultPost</strong> ("Plataforma", "Serviço", "nós", "nosso" ou "nos"). 
            Ao acessar ou usar o MultPost, você ("usuário", "você" ou "seu") concorda com estes 
            Termos de Serviço ("Termos"). Caso não concorde, não utilize a Plataforma.
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              1. Descrição do Serviço
            </h2>
            <p className="text-gray-700 leading-relaxed">
              O MultPost é um software SaaS que permite realizar upload de vídeos, adicionar títulos 
              e descrições e publicar automaticamente em diversas plataformas, como TikTok, YouTube Shorts, 
              Instagram Reels e Kwai.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              2. Aceitação dos Termos
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Ao criar uma conta ou usar o serviço, você declara que tem pelo menos 18 anos, 
              forneceu informações verdadeiras e concorda com nossas políticas.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              3. Criação de Conta
            </h2>
            <p className="text-gray-700 leading-relaxed">
              O usuário deve criar uma conta com e-mail válido e senha segura. Você é responsável 
              por manter suas credenciais seguras e pelo uso da conta.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              4. Uso da Plataforma
            </h2>
            <p className="text-gray-700 leading-relaxed">
              É proibido usar o MultPost para publicar conteúdo ilegal, ofensivo, com direitos 
              autorais de terceiros, ou violar as políticas das plataformas integradas.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              5. Integrações com Plataformas de Terceiros
            </h2>
            <p className="text-gray-700 leading-relaxed">
              O MultPost utiliza APIs oficiais de plataformas externas. O funcionamento pode ser 
              afetado por alterações nas políticas dessas plataformas.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              6. Planos e Pagamentos
            </h2>
            <p className="text-gray-700 leading-relaxed">
              O MultPost oferece planos gratuitos e pagos. Os pagamentos são processados por 
              serviços terceirizados e não armazenamos dados de cartão.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              7. Propriedade Intelectual
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Todo o conteúdo e código do MultPost pertencem à empresa desenvolvedora. O usuário 
              mantém a titularidade dos vídeos que enviar.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              8. Limitação de Responsabilidade
            </h2>
            <p className="text-gray-700 leading-relaxed">
              O MultPost não se responsabiliza por falhas nas APIs, bloqueios de contas externas 
              ou danos indiretos decorrentes do uso do serviço.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              9. Cancelamento e Encerramento
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Você pode encerrar sua conta a qualquer momento. Contas que violem os Termos podem 
              ser encerradas sem aviso prévio.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              10. Alterações nos Termos
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Os Termos podem ser atualizados periodicamente. O uso contínuo do serviço após 
              alterações implica aceitação das novas condições.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              11. Contato
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Dúvidas? Entre em contato:{' '}
              <a 
                href="mailto:suporte@multpost.com" 
                className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
              >
                suporte@multpost.com
              </a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              12. Legislação Aplicável
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Estes Termos são regidos pelas leis da República Federativa do Brasil. O foro 
              competente será o da comarca do usuário, salvo disposição legal em contrário.
            </p>
          </section>
        </article>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              © 2025 MultPost. Todos os direitos reservados.
            </p>
            <div className="flex gap-4">
              <a 
                href="/" 
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
              >
                Voltar ao início
              </a>
              <a 
                href="/privacidade" 
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
              >
                Política de Privacidade
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}