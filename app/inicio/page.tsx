import type { Metadata } from "next";
import { Brand } from "../components/brand";
import { AccountButton } from "../components/auth/account-button";
import { SessionGate } from "../components/auth/session-gate";
import { Icon } from "../components/ui-icon";
import { TvVisual } from "../components/tv-visual";
import { PlanDemo } from "../components/plan-demo";
import { PlanAssistantButton } from "../components/plan-assistant-button";
import { Reviews } from "../components/reviews";
import { plans, promotion, whatsappLink, whatsappDisplayNumber } from "@/lib/site/plans";

export const metadata: Metadata = { title: "Planos e entretenimento | MCZ onTV" };

const navItems = [{ label: "Início", href: "#inicio" }, { label: "Planos", href: "#planos" }, { label: "Como contratar", href: "#como-contratar" }, { label: "Atendimento", href: "#atendimento" }];
const faqs = [
  { question: "Quem pode aproveitar a oferta de R$15,00/mês?", answer: `A oferta é exclusiva para novos clientes: ${promotion.description} Consulte as condições com o atendimento antes de contratar.` },
  { question: "O login já contrata ou ativa um plano?", answer: "Não. O login permite conhecer os planos. A contratação e a orientação sobre ativação são feitas manualmente pelo atendimento no WhatsApp." },
  { question: "Como faço para contratar?", answer: "Escolha um plano para abrir o Assistente MCZ. Consulte as condições, confira o resumo e finalize pelo WhatsApp." },
  { question: "O que acontece depois dos 6 meses promocionais?", answer: "Após os 6 primeiros meses, o valor do plano mensal passa para R$25,00/mês. A condição de R$15,00/mês é válida exclusivamente para novos clientes." },
];

function Navigation() {
  return <>{navItems.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}</>;
}

export default function MemberHome() {
  return <SessionGate audience="member">
    <a className="skip-link" href="#conteudo">Ir para o conteúdo</a>
    <header className="site-header" id="inicio"><div className="container header-inner"><Brand href="/inicio" /><nav className="desktop-nav" aria-label="Menu principal"><Navigation /></nav><div className="header-actions"><AccountButton /><details className="mobile-menu"><summary aria-label="Abrir menu"><Icon name="menu" /></summary><nav aria-label="Menu mobile"><Navigation /></nav></details></div></div></header>
    <main id="conteudo">
      <section className="member-hero container" aria-labelledby="member-hero-title"><div className="member-hero-copy"><span className="eyebrow"><span /> BEM-VINDO À MCZ ONTV</span><h1 id="member-hero-title">Seu próximo play<br /><span>começa aqui.</span></h1><p>Escolha o plano que combina com o seu momento. A gente cuida do atendimento, você escolhe o próximo passo.</p><div className="hero-actions"><a className="primary-button" href="#planos">Conhecer os planos <Icon name="arrow" /></a><a className="text-button" href={whatsappLink()} target="_blank" rel="noopener noreferrer">Falar com atendimento <Icon name="chat" /></a></div><p className="hero-note"><Icon name="shield" /> Contratação e atendimento pelo WhatsApp.</p></div><TvVisual /></section>
      <div className="container"><aside className="promo-banner" aria-label="Oferta exclusiva para novos clientes"><div><span className="offer-label">EXCLUSIVO PARA NOVOS CLIENTES</span><h2>Uma condição especial para o seu primeiro play.</h2></div><div className="promo-banner-value"><strong>R$ {promotion.price}<span>/mês</span></strong><p>durante os 6 primeiros meses</p><small>Após esse período: R$ {promotion.regularPrice}/mês</small></div></aside></div>
      <section className="plans-section container" id="planos" aria-labelledby="plans-title"><div className="section-heading"><span className="kicker">ESCOLHA SEU PRÓXIMO PLAY</span><h2 id="plans-title">Qualidade em <span>todos os planos.</span></h2><p>Valores claros. Contratação com atendimento humano.</p></div><div className="plans-grid">{plans.map((plan) => <article className={`plan-card ${plan.id === "anual" ? "featured" : ""}`} key={plan.id}>{"badge" in plan && <span className="plan-badge">{plan.badge}</span>}<PlanDemo planId={plan.id} planName={plan.name} /><h3>{plan.name}</h3><p className="plan-summary">{plan.summary}</p><div className="plan-price"><span>R$</span><strong>{plan.price}</strong></div><p className="plan-period">{plan.period}</p><div className="plan-detail">{plan.id === "mensal" ? <><span className="new-client-label">PARA NOVOS CLIENTES</span><p>{promotion.description}</p><small>{promotion.eligibility}</small></> : <><Icon name="check" /><p>Valor total para {plan.months} meses.</p><small>Contratação pelo atendimento.</small></>}</div><PlanAssistantButton plan={plan} /></article>)}</div><p className="plans-note"><Icon name="shield" /> Escolher um plano abre uma conversa. Não há pagamento ou ativação automática no site.</p></section>
      <Reviews />
      <section className="steps-section container" id="como-contratar" aria-labelledby="steps-title"><div className="section-heading"><span className="kicker">DO SEU JEITO, SEM COMPLICAÇÃO</span><h2 id="steps-title">Seu entretenimento em <span>três passos.</span></h2></div><div className="steps-grid">{[{ n: "01", title: "Conheça os planos", text: "Compare os períodos e confira as condições para novos clientes." }, { n: "02", title: "Escolha seu plano", text: "Clique no botão do plano para abrir o Assistente MCZ com sua escolha." }, { n: "03", title: "Fale com a gente", text: "Confira o resumo no assistente e finalize pelo WhatsApp. Nossa equipe orienta a contratação e a ativação manualmente." }].map((step) => <article key={step.n}><span className="step-number">{step.n}</span><h3>{step.title}</h3><p>{step.text}</p></article>)}</div></section>
      <section className="faq-section container" aria-labelledby="faq-title"><div><span className="kicker">ANTES DO PRÓXIMO PLAY</span><h2 id="faq-title">Tudo às claras<span>.</span></h2><p>As respostas para começar<br />com tranquilidade.</p></div><div className="faq-list">{faqs.map((faq) => <details key={faq.question}><summary>{faq.question}<span aria-hidden="true">+</span></summary><p>{faq.answer}</p></details>)}</div></section>
      <section className="support-section container" id="atendimento" aria-labelledby="support-title"><div className="support-icon"><Icon name="chat" /></div><div><span className="kicker">ATENDIMENTO HUMANO</span><h2 id="support-title">Vamos conversar?</h2><p>Dúvidas, condições e contratação: fale com a equipe MCZ onTV.</p></div><a className="primary-button" href={whatsappLink()} target="_blank" rel="noopener noreferrer"><Icon name="chat" /> {whatsappDisplayNumber}</a></section>
    </main>
    <footer className="site-footer"><div className="container"><div className="footer-top"><div><Brand href="/inicio" /><p>Seu entretenimento começa aqui.</p></div><nav aria-label="Menu do rodapé"><Navigation /></nav></div><div className="footer-bottom"><p>© 2026 MCZ onTV. Todos os direitos reservados.</p><p>Contratação e ativação por atendimento manual.</p></div></div></footer>
    <a className="whatsapp-float" href={whatsappLink()} target="_blank" rel="noopener noreferrer" aria-label="Falar com a MCZ onTV no WhatsApp"><Icon name="chat" /></a>
  </SessionGate>;
}
