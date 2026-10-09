"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { assistantOpenEvent } from "./plan-assistant-button";
import { plans } from "@/lib/site/plans";
import { useAuth } from "./auth/auth-provider";
import { assistantGreeting, assistantReducer, attendantLink, initialAssistantState } from "@/lib/site/assistant";

export function MczAssistant() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [state, dispatch] = useReducer(assistantReducer, initialAssistantState);
  const launcher = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const history = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) heading.current?.focus();
  }, [open]);
  useEffect(() => {
    if (open && history.current) history.current.scrollTop = history.current.scrollHeight;
  }, [open, state.messages]);

  useEffect(() => {
    function openPlan(event: Event) {
      const plan = plans.find((plan) => plan.id === (event as CustomEvent).detail);
      if (!plan) return;
      dispatch({ id: `plano:${plan.id}`, label: `Escolher plano ${plan.name}` });
      setOpen(true);
      heading.current?.focus();
    }
    window.addEventListener(assistantOpenEvent, openPlan);
    return () => window.removeEventListener(assistantOpenEvent, openPlan);
  }, []);

  function hide() {
    setOpen(false);
    launcher.current?.focus();
  }

  return <div className="mcz-assistant">
    {open && <section id="mcz-assistant-chat" className="assistant-panel" role="dialog" aria-labelledby="mcz-assistant-title" aria-describedby="mcz-assistant-description"
      onKeyDown={(event) => { if (event.key === "Escape") { event.stopPropagation(); hide(); } }}>
      <header className="assistant-header"><div><h2 id="mcz-assistant-title" ref={heading} tabIndex={-1}>🤖 Assistente MCZ</h2><p id="mcz-assistant-description">Atendimento guiado por opções</p></div><div className="assistant-controls"><button type="button" onClick={hide} aria-label="Minimizar assistente">−</button><button type="button" onClick={hide} aria-label="Fechar assistente">×</button></div></header>
      <div className="assistant-history" ref={history} role="log" aria-label="Histórico da conversa" aria-live="polite" aria-relevant="additions" tabIndex={0}>
        <p className="assistant-message">{assistantGreeting(user?.displayName)}</p>
        {state.messages.map((message, index) => <p className={`assistant-message ${message.role === "user" ? "from-user" : ""}`} key={index}><span className="sr-only">{message.role === "user" ? "Você: " : "Assistente virtual: "}</span>{message.text}</p>)}
      </div>
      {state.selectedPlan && <p className="assistant-selected-plan">Plano selecionado: {state.selectedPlan.name}</p>}
      <div className="assistant-options" aria-label="Opções de atendimento">{state.reply.options.map((option) => <button type="button" key={option.id} onClick={() => dispatch(option)}>{option.label}</button>)}{state.reply.link && <a className="assistant-contact" href={state.reply.link.href} target="_blank" rel="noopener noreferrer">{state.reply.link.label}<span className="sr-only"> (abre o WhatsApp em outra aba)</span></a>}</div>
      <footer className="assistant-footer"><button type="button" onClick={() => dispatch({ id: "inicio", label: "Voltar ao início" })}>Voltar ao início</button><a href={attendantLink} target="_blank" rel="noopener noreferrer">Falar com atendente<span className="sr-only"> (abre o WhatsApp em outra aba)</span></a></footer>
    </section>}
    <button ref={launcher} type="button" className="assistant-launcher" aria-expanded={open} aria-controls={open ? "mcz-assistant-chat" : undefined} onClick={() => open ? hide() : setOpen(true)}><span>🤖 Assistente MCZ</span><small><span aria-hidden="true" /> Guiado</small></button>
  </div>;
}
