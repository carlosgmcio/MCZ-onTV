"use client";

import { useState } from "react";
import { calculateResale, calculateReinvestment, formatBRL, minimumResalePrice, packageDescription, resellerPackages, starterPackage, resalePriceNotice } from "@/lib/site/reseller";

export function ResellerCalculator() {
  const [packageId, setPackageId] = useState<string>(starterPackage.id);
  const [price, setPrice] = useState(String(minimumResalePrice));
  const [sold, setSold] = useState(String(starterPackage.credits));
  const [reinvest, setReinvest] = useState(false);
  const [reinvestId, setReinvestId] = useState<string>(starterPackage.id);
  const pkg = resellerPackages.find((item) => item.id === packageId) ?? starterPackage;
  const newPackage = resellerPackages.find((item) => item.id === reinvestId) ?? starterPackage;
  const result = price.trim() && sold.trim() ? calculateResale(pkg, Number(price), Number(sold)) : null;
  const priceValid = price.trim() !== "" && Number.isFinite(Number(price)) && Number(price) >= minimumResalePrice;
  const soldValid = sold.trim() !== "" && Number.isInteger(Number(sold)) && Number(sold) >= 0 && Number(sold) <= pkg.credits;
  const reinvestment = result ? calculateReinvestment(result.revenue, newPackage) : null;

  return <div className="reseller-calculator">
    <div className="reseller-fields">
      <label htmlFor="reseller-package">Pacote de créditos<select id="reseller-package" value={packageId} onChange={(event) => {
        setPackageId(event.target.value);
        const next = resellerPackages.find((item) => item.id === event.target.value);
        if (next) setSold(String(next.credits));
      }}>{resellerPackages.map((item) => <option key={item.id} value={item.id}>{packageDescription(item)}</option>)}</select></label>
      <label htmlFor="reseller-price">Preço de revenda por crédito (R$)<input id="reseller-price" type="number" min={minimumResalePrice} step="0.01" inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} aria-invalid={!priceValid} aria-describedby="reseller-price-help" /></label>
      <label htmlFor="reseller-sold">Créditos que pretende vender<input id="reseller-sold" type="number" min="0" max={pkg.credits} step="1" inputMode="numeric" value={sold} onChange={(event) => setSold(event.target.value)} aria-invalid={!soldValid} aria-describedby={!soldValid ? "reseller-sales-help" : undefined} /></label>
    </div>
    <p id="reseller-price-help" className={!priceValid ? "reseller-error" : "reseller-note"}>{priceValid ? "Preço livre a partir de R$ 25,00, sem limite máximo." : "Informe um preço de pelo menos R$ 25,00 por crédito."}</p>
    {!soldValid && <p id="reseller-sales-help" className="reseller-error">Informe uma quantidade inteira entre 0 e {pkg.credits} créditos.</p>}
    <div aria-live="polite" aria-atomic="true">
      {result ? <><dl className="reseller-results">
        <div><dt>Investimento total</dt><dd>{formatBRL(result.investment)}</dd></div>
        <div><dt>Faturamento bruto</dt><dd>{formatBRL(result.revenue)}</dd></div>
        <div><dt>Lucro bruto / resultado bruto</dt><dd>{formatBRL(result.grossProfit)}</dd></div>
        <div><dt>Créditos restantes</dt><dd>{result.remainingCredits}</dd></div>
      </dl><p className="reseller-note">O resultado desconta o investimento total do pacote.{result.remainingCredits > 0 ? ` Ainda existem ${result.remainingCredits} créditos não vendidos.` : " Todos os créditos foram considerados na simulação."}</p></> : <p className="reseller-note">Preencha valores válidos para calcular os resultados.</p>}
    </div>
    <p className="reseller-note">{resalePriceNotice}</p>
    <section className="reseller-reinvestment" aria-labelledby="reinvestment-title">
      <h3 id="reinvestment-title">Como reinvestir seus ganhos?</h3>
      <p>Use o faturamento recebido para simular a compra de outro pacote.</p>
      <button className="primary-button" type="button" onClick={() => setReinvest(true)} aria-expanded={reinvest} aria-controls="reinvestment-results">Simular reinvestimento</button>
      {reinvest && <div id="reinvestment-results">
        <label htmlFor="reinvestment-package">Pacote para reinvestir<select id="reinvestment-package" value={reinvestId} onChange={(event) => setReinvestId(event.target.value)}>{resellerPackages.map((item) => <option key={item.id} value={item.id}>{packageDescription(item)}</option>)}</select></label>
        <div aria-live="polite" aria-atomic="true">{reinvestment ? <><dl className="reseller-results">
          <div><dt>Dinheiro recebido</dt><dd>{formatBRL(reinvestment.received)}</dd></div>
          <div><dt>Novo investimento</dt><dd>{formatBRL(reinvestment.investment)}</dd></div>
          <div><dt>Dinheiro restante em caixa</dt><dd>{formatBRL(reinvestment.cash)}</dd></div>
          <div><dt>Novos créditos disponíveis</dt><dd>{reinvestment.newCredits}</dd></div>
        </dl>{reinvestment.shortfall > 0 && <p className="reseller-error">O valor recebido não cobre esse pacote. Faltam {formatBRL(reinvestment.shortfall)} para a recompra.</p>}
        <p className="reseller-note">Saldo em caixa não é lucro adicional. O custo do primeiro pacote não é descontado novamente. A recompra depende da confirmação do atendimento.</p></> : <p className="reseller-note">Corrija os valores do simulador para calcular o reinvestimento.</p>}</div>
      </div>}
    </section>
  </div>;
}
