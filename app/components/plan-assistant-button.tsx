"use client";

import type { Plan } from "@/lib/site/plans";
import { Icon } from "./ui-icon";

export const assistantOpenEvent = "mcz-assistant-open";
export function PlanAssistantButton({ plan }: { plan: Plan }) {
  return <button type="button" className="plan-button" aria-label={`Escolher plano ${plan.name} no Assistente MCZ`} onClick={() => window.dispatchEvent(new CustomEvent(assistantOpenEvent, { detail: plan.id }))}><Icon name="chat" /> Escolher plano</button>;
}
