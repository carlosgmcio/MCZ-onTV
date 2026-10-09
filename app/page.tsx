import { Brand } from "./components/brand";
import { Reviews } from "./components/reviews";
import { GoogleButton } from "./components/auth/google-button";
import { SessionGate } from "./components/auth/session-gate";
import { Icon } from "./components/ui-icon";
import { plans, planDuration } from "@/lib/site/plans";

export default function EntryPage() {
  return <SessionGate audience="visitor">
    <a className="skip-link" href="#apresentacao">Ir para o conteúdo</a>
    <div className="entry-page">
      <header className="entry-header container"><Brand /><span className="entry-header-note">O SEU PRÓXIMO PLAY COMEÇA AQUI</span></header>
      <main className="entry-main container" id="apresentacao">
        <section className="entry-offer" aria-labelledby="offer-title">
          <span className="eyebrow"><span /> BEM-VINDO AO SEU NOVO MOMENTO</span>
          <h1 id="offer-title">Seu entretenimento<br /><span>começa aqui.</span> <span className="tv-emoji">📺</span></h1>
          <p className="entry-description">Conheça os planos MCZ onTV e escolha pelo Assistente MCZ.</p>
          <div className="offer-box">
            <span className="offer-label"><Icon name="sparkles" /> PLANO MENSAL</span>
            <div className="offer-price"><span className="currency">R$</span><strong>{plans[0].price}</strong><span className="price-period">{plans[0].period}</span></div>
            <p className="offer-duration">Valor total para {planDuration(plans[0])}.</p>
            <p className="offer-eligibility"><Icon name="check" /> Contratação pelo atendimento.</p>
            <p className="offer-login-prompt">Entre para conhecer os planos e conversar com o Assistente MCZ.</p>
          </div>
          <div className="entry-details"><span><Icon name="chat" /> Atendimento pelo WhatsApp</span><span><Icon name="shield" /> Contratação manual</span></div>
        </section>
        <section className="login-card" aria-labelledby="entry-login-title">
          <span className="login-card-icon"><Icon name="play" /></span>
          <span className="kicker">A UM PLAY DE DISTÂNCIA</span>
          <h2 id="entry-login-title">Bem-vindo à<br />MCZ <span>onTV</span></h2>
          <GoogleButton />
          <div className="login-divider"><span /> SIMPLES ASSIM <span /></div>
          <ul className="login-steps"><li><span>01</span> Entre com sua conta Google</li><li><span>02</span> Escolha no Assistente MCZ</li><li><span>03</span> Contrate pelo WhatsApp</li></ul>
          <p className="login-footnote"><Icon name="shield" /> O login não realiza cobrança ou ativação automática.</p>
        </section>
      </main>
      <Reviews />
      <footer className="entry-footer container"><span>© 2026 MCZ onTV</span><span>Seu entretenimento começa aqui.</span></footer>
    </div>
  </SessionGate>;
}
