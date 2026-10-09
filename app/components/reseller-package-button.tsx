"use client";

import { resellerAssistantOpenEvent, type ResellerPackage } from "@/lib/site/reseller";
import { Icon } from "./ui-icon";

export function ResellerPackageButton({ pkg }: { pkg: ResellerPackage }) {
  return <button type="button" className="plan-button" aria-label={`Escolher pacote de ${pkg.credits} créditos no Assistente MCZ`}
    onClick={() => window.dispatchEvent(new CustomEvent(resellerAssistantOpenEvent, { detail: { type: "revenda", packageId: pkg.id } }))}>
    <Icon name="chat" /> Escolher pacote
  </button>;
}
