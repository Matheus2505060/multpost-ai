import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidade – MultPost',
  description: 'Política de Privacidade do MultPost: como coletamos, usamos, compartilhamos e protegemos seus dados, conforme a LGPD (Lei nº 13.709/2018).',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-5 py-12 max-w-4xl">
        <article className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl">
          <header>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-100 mb-2">
              Política de Privacidade – MultPost
            </h1>
            <p className="text-slate-400 text-sm mb-6">
              Última atualização: 30 de outubro de 2025
            </p>
            <p className="text-slate-300 leading-relaxed">
              Bem-vindo ao <strong>MultPost</strong> (
              <a 
                href="https://multpost.lasy.pro" 
                target="_blank" 
                rel="noopener"
                className="text-blue-400 hover:text-blue-300 hover:underline"
              >
                https://multpost.lasy.pro
              </a>
              ). Esta Política de Privacidade descreve como coletamos, utilizamos, armazenamos e protegemos as informações dos usuários de nossa plataforma, em conformidade com a <strong>LGPD (Lei nº 13.709/2018)</strong>.
            </p>
          </header>

          <nav className="bg-slate-900/50 border border-dashed border-slate-600 rounded-xl p-4 my-6">
            <strong className="text-slate-200 block mb-3">Sumário</strong>
            <div className="space-y-2">
              <a href="#1" className="block text-blue-400 hover:text-blue-300 hover:underline py-1">1. Informações Gerais</a>
              <a href="#2" className="block text-blue-400 hover:text-blue-300 hover:underline py-1">2. Dados Coletados</a>
              <a href="#3" className="block text-blue-400 hover:text-blue-300 hover:underline py-1">3. Finalidade do Tratamento</a>
              <a href="#4" className="block text-blue-400 hover:text-blue-300 hover:underline py-1">4. Compartilhamento de Dados</a>
              <a href="#5" className="block text-blue-400 hover:text-blue-300 hover:underline py-1">5. Armazenamento e Segurança</a>
              <a href="#6" className="block text-blue-400 hover:text-blue-300 hover:underline py-1">6. Direitos do Usuário (LGPD)</a>
              <a href="#7" className="block text-blue-400 hover:text-blue-300 hover:underline py-1">7. Retenção de Dados</a>
              <a href="#8" className="block text-blue-400 hover:text-blue-300 hover:underline py-1">8. Cookies e Tecnologias</a>
              <a href="#9" className="block text-blue-400 hover:text-blue-300 hover:underline py-1">9. Alterações desta Política</a>
              <a href="#10" className="block text-blue-400 hover:text-blue-300 hover:underline py-1">10. Contato</a>
            </div>
          </nav>

          <section id="1" className="mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-200 mb-4 mt-7 border-b border-slate-600 pb-2">
              1. Informações Gerais
            </h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              O <strong>MultPost</strong> é uma plataforma operada por <strong>Matheus Felipe Cavalcante Ferreira</strong>, pessoa física, residente no Brasil, responsável pelo tratamento dos dados pessoais coletados por meio deste site e aplicativo.
            </p>
            <p className="text-slate-300 leading-relaxed">
              Para dúvidas relacionadas à privacidade, entre em contato pelo e-mail: 
              <a 
                href="mailto:appxlab.prime@gmail.com"
                className="text-blue-400 hover:text-blue-300 hover:underline ml-1"
              >
                appxlab.prime@gmail.com
              </a>.
            </p>
          </section>

          <section id="2" className="mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-200 mb-4 mt-7 border-b border-slate-600 pb-2">
              2. Dados Coletados
            </h2>
            <ul className="text-slate-300 leading-relaxed space-y-2 list-disc list-inside">
              <li>Nome completo;</li>
              <li>Endereço de e-mail;</li>
              <li>Senha de acesso (armazenada de forma criptografada);</li>
              <li>Conteúdos enviados pelo usuário (vídeos, títulos, descrições e metadados);</li>
              <li>Informações de autenticação provenientes das APIs de redes sociais (TikTok, YouTube, Instagram etc.);</li>
              <li>Dados técnicos, como endereço IP, tipo de navegador e logs de acesso.</li>
            </ul>
          </section>

          <section id="3" className="mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-200 mb-4 mt-7 border-b border-slate-600 pb-2">
              3. Finalidade do Tratamento
            </h2>
            <ul className="text-slate-300 leading-relaxed space-y-2 list-disc list-inside">
              <li>Permitir o uso das funcionalidades da plataforma, incluindo a postagem automática de vídeos nas redes sociais integradas;</li>
              <li>Gerenciar a conta do usuário e autenticar o login;</li>
              <li>Melhorar a experiência do usuário e o desempenho do serviço;</li>
              <li>Cumprir obrigações legais e regulatórias.</li>
            </ul>
          </section>

          <section id="4" className="mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-200 mb-4 mt-7 border-b border-slate-600 pb-2">
              4. Compartilhamento de Dados
            </h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              O <strong>MultPost</strong> poderá compartilhar dados pessoais apenas quando necessário para a execução dos serviços, incluindo:
            </p>
            <ul className="text-slate-300 leading-relaxed space-y-2 list-disc list-inside mb-4">
              <li><strong>Plataformas de redes sociais</strong> (TikTok, YouTube, Instagram, etc.), por meio de suas <strong>APIs oficiais</strong>, exclusivamente para publicação de conteúdo autorizado pelo usuário;</li>
              <li><strong>Serviços de hospedagem e processamento de dados</strong>, contratados para manter o funcionamento do sistema;</li>
              <li><strong>Autoridades legais</strong>, quando houver obrigação legal ou solicitação judicial.</li>
            </ul>
            <p className="text-slate-300 leading-relaxed">
              Não vendemos, alugamos ou comercializamos dados pessoais sob nenhuma circunstância.
            </p>
          </section>

          <section id="5" className="mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-200 mb-4 mt-7 border-b border-slate-600 pb-2">
              5. Armazenamento e Segurança
            </h2>
            <p className="text-slate-300 leading-relaxed">
              Os dados são armazenados em servidores seguros, com medidas de proteção contra acesso não autorizado, destruição, perda, alteração ou divulgação indevida. Apesar dos nossos esforços, nenhum sistema é completamente livre de riscos. O usuário reconhece que o fornecimento de informações ocorre por sua conta e risco.
            </p>
          </section>

          <section id="6" className="mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-200 mb-4 mt-7 border-b border-slate-600 pb-2">
              6. Direitos do Usuário (LGPD)
            </h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              Nos termos da <strong>Lei nº 13.709/2018 (LGPD)</strong>, o usuário tem direito a:
            </p>
            <ul className="text-slate-300 leading-relaxed space-y-2 list-disc list-inside mb-4">
              <li>Acessar seus dados pessoais;</li>
              <li>Corrigir dados incorretos ou desatualizados;</li>
              <li>Solicitar a exclusão de seus dados;</li>
              <li>Revogar consentimentos concedidos;</li>
              <li>Solicitar informações sobre o compartilhamento de dados.</li>
            </ul>
            <p className="text-slate-300 leading-relaxed">
              Para exercer esses direitos, envie uma solicitação para 
              <a 
                href="mailto:appxlab.prime@gmail.com"
                className="text-blue-400 hover:text-blue-300 hover:underline ml-1"
              >
                appxlab.prime@gmail.com
              </a>.
            </p>
          </section>

          <section id="7" className="mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-200 mb-4 mt-7 border-b border-slate-600 pb-2">
              7. Retenção de Dados
            </h2>
            <p className="text-slate-300 leading-relaxed">
              Os dados pessoais serão mantidos apenas pelo tempo necessário para cumprir as finalidades descritas nesta Política ou conforme exigido por lei. Após esse período, os dados poderão ser anonimizados ou excluídos de forma segura.
            </p>
          </section>

          <section id="8" className="mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-200 mb-4 mt-7 border-b border-slate-600 pb-2">
              8. Cookies e Tecnologias
            </h2>
            <p className="text-slate-300 leading-relaxed">
              Podemos utilizar cookies e tecnologias similares para melhorar a experiência do usuário, lembrar preferências e coletar estatísticas de uso. O usuário pode desativar cookies nas configurações do navegador, mas isso pode afetar o funcionamento do site.
            </p>
          </section>

          <section id="9" className="mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-200 mb-4 mt-7 border-b border-slate-600 pb-2">
              9. Alterações desta Política
            </h2>
            <p className="text-slate-300 leading-relaxed">
              Esta Política de Privacidade pode ser atualizada periodicamente. As alterações serão publicadas nesta página, com a data da última atualização indicada no início do documento.
            </p>
          </section>

          <section id="10" className="mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-200 mb-4 mt-7 border-b border-slate-600 pb-2">
              10. Contato
            </h2>
            <div className="text-slate-300 leading-relaxed">
              <p className="mb-2">
                <strong>Responsável:</strong> Matheus Felipe Cavalcante Ferreira
              </p>
              <p className="mb-2">
                <strong>E-mail:</strong> 
                <a 
                  href="mailto:appxlab.prime@gmail.com"
                  className="text-blue-400 hover:text-blue-300 hover:underline ml-1"
                >
                  appxlab.prime@gmail.com
                </a>
              </p>
              <p>
                <strong>Domínio:</strong> 
                <a 
                  href="https://multpost.lasy.pro" 
                  target="_blank" 
                  rel="noopener"
                  className="text-blue-400 hover:text-blue-300 hover:underline ml-1"
                >
                  https://multpost.lasy.pro
                </a>
              </p>
            </div>
          </section>

          <footer className="mt-7 pt-4 text-slate-400 text-sm border-t border-slate-600">
            <p>
              Se você tiver dúvidas sobre esta Política ou sobre como tratamos seus dados, entre em contato pelo e-mail indicado acima.
            </p>
          </footer>
        </article>
      </div>
    </div>
  )
}