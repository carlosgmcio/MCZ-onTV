import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "../components/brand";
import { AccountButton } from "../components/auth/account-button";
import { Icon } from "../components/ui-icon";
import { ResellerPackageButton } from "../components/reseller-package-button";
import { ResellerCalculator } from "../components/reseller-calculator";
import { calculateResale, formatBRL, resellerPackages, resaleExamples, starterPackage, resalePriceNotice, resellerDisclaimer } from "@/lib/site/reseller";
import "./revendedor.css";

export const metadata: Metadata = { title: "Seja um revendedor | MCZ onTV", description: "Conheça os pacotes de créditos MCZ onTV, defina seu preço de revenda e simule faturamento, resultado bruto e reinvestimento." };
const navigation = [
  { label: "Início", href: "/inicio#inicio" },
  { label: "Planos", href: "/inicio#planos" },
  { label: "Como contratar", href: "/inicio#como-contratar" },
  { label: "Atendimento", href: "/inicio#atendimento" },
  { label: "Seja um revendedor", href: "/revendedor" },
];
function Navigation() {
  return <>{navigation.map((item) => <Link key={item.href} href={item.href} aria-current={item.href === "/revendedor" ? "page" : undefined}>{item.label}</Link>)}</>;
}

export default function ResellerPage() {
  return <div className="reseller-page">
    <a className="skip-link" href="#reseller-content">Ir para o conteúdo</a>
    <header className="site-header"><div className="container header-inner"><Brand href="/inicio" /><nav className="desktop-nav" aria-label="Menu principal"><Navigation /></nav><div className="header-actions"><AccountButton /><details className="mobile-menu"><summary aria-label="Abrir menu"><Icon name="menu" /></summary><nav aria-label="Menu mobile"><Navigation /></nav></details></div></div></header>
    <main id="reseller-content" className="container">
      <section className="reseller-hero" aria-labelledby="reseller-title">
        <div><span className="eyebrow"><span /> UM NOVO PASSO COM A MCZ ONTV</span><h1 id="reseller-title">SEJA UM REVENDEDOR<br /><span>MCZ onTV 🚀</span></h1><p>Comece seu negócio de revenda digital. Escolha seu pacote de créditos, defina seu preço de venda e acompanhe seu potencial de lucro.</p><a className="primary-button" href="#pacotes">Ver pacotes <Icon name="arrow" /></a></div>
        <ul className="reseller-highlights"><li><Icon name="check" /><span>Pacotes a partir de <strong>R$ 30,00.</strong></span></li><li><Icon name="check" /><span>Preço de revenda a partir de <strong>R$ 25,00 por crédito.</strong></span></li><li><Icon name="chat" /><span>Atendimento para novos revendedores.</span></li></ul>
      </section>
      <section className="reseller-section" id="pacotes" aria-labelledby="packages-title">
        <div className="section-heading"><span className="kicker">ESCOLHA COMO COMEÇAR</span><h2 id="packages-title">Seu pacote, <span>seu próximo passo.</span></h2><p>Valores oficiais. Contratação com atendimento humano.</p></div>
        <div className="reseller-packages">{resellerPackages.map((pkg) => <article key={pkg.id} className={`plan-card ${pkg.id === starterPackage.id ? "featured" : ""}`}>{pkg.id === starterPackage.id && <span className="plan-badge">OPÇÃO INICIAL</span>}<h3>{pkg.credits} créditos</h3><div className="reseller-package-price">{formatBRL(pkg.price)}</div><p>Preço total do pacote</p><div className="plan-detail"><Icon name="check" /><p>{formatBRL(pkg.price / pkg.credits)} por crédito</p><small>Contratação pelo atendimento.</small></div><ResellerPackageButton pkg={pkg} /></article>)}</div>
      </section>
      <section className="reseller-freedom reseller-section" aria-labelledby="freedom-title">
        <span className="kicker">LIBERDADE DE PREÇO</span><h2 id="freedom-title">💰 Você define quanto quer ganhar!</h2>
        <p>Na MCZ onTV, você tem liberdade para definir seu preço de revenda! O valor mínimo por crédito é R$ 25,00, mas você pode vender por R$ 30,00, R$ 35,00, R$ 40,00, R$ 50,00 ou qualquer valor superior. Quanto maior o preço de venda, maior poderá ser sua margem de lucro.</p>
        <div className="reseller-table-wrap" role="region" aria-label="Exemplos de lucro com 10 créditos" tabIndex={0}><table><caption>Exemplos com {starterPackage.credits} créditos, comprados por {formatBRL(starterPackage.price)} e vendidos integralmente</caption><thead><tr><th scope="col">Preço por crédito</th><th scope="col">Faturamento total</th><th scope="col">Lucro bruto</th></tr></thead><tbody>{resaleExamples.map((price) => {
          const result = calculateResale(starterPackage, price, starterPackage.credits)!;
          return <tr key={price}><th scope="row">{formatBRL(price)}</th><td>{formatBRL(result.revenue)}</td><td>{formatBRL(result.grossProfit)}</td></tr>;
        })}</tbody></table></div>
        <p className="reseller-note">{resalePriceNotice}</p>
      </section>
      <section className="reseller-section" id="simulador" aria-labelledby="calculator-title"><div className="section-heading"><span className="kicker">FAÇA AS CONTAS</span><h2 id="calculator-title">Simule o seu <span>resultado.</span></h2><p>Escolha um pacote, seu preço e a quantidade de créditos que pretende vender.</p></div><ResellerCalculator /><p className="reseller-note">{resellerDisclaimer}</p></section>
      <section className="reseller-section" aria-labelledby="reseller-steps-title"><div className="section-heading"><span className="kicker">DO PACOTE À REVENDA</span><h2 id="reseller-steps-title">Como funciona <span>a revenda?</span></h2></div><ol className="reseller-steps">{[
        "Escolha um pacote de créditos.",
        "Converse com o Assistente MCZ e solicite sua contratação.",
        "Após a confirmação do atendimento, receba os créditos conforme as condições contratadas.",
        "Revenda aos seus clientes e acompanhe seus resultados.",
      ].map((text, index) => <li key={text}><span className="step-number">0{index + 1}</span><p>{text}</p></li>)}</ol><p className="reseller-note">Nenhuma compra de créditos, cobrança ou ativação é realizada automaticamente pelo site.</p></section>
    </main>
    <footer className="site-footer"><div className="container"><div className="footer-top"><Brand href="/inicio" /><nav aria-label="Menu do rodapé"><Navigation /></nav></div><div className="footer-bottom"><p>© 2026 MCZ onTV. Todos os direitos reservados.</p><p>Revenda e contratação por atendimento humano.</p></div></div></footer>
  </div>;
}
