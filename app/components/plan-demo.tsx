"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Plan } from "@/lib/site/plans";
import { demoSource, planDemos, previewSource, previewThumbnail } from "@/lib/site/plan-demos";
import { watchPreview } from "@/lib/site/preview-visibility";
import { Icon } from "./ui-icon";

export function PlanDemo({ planId, planName }: { planId: Plan["id"]; planName: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const [previewActive, setPreviewActive] = useState(false);
  const titleId = useId();
  const demo = planDemos[planId];
  const source = demoSource(demo);
  const preview = previewSource(demo);
  const thumbnail = previewThumbnail(demo);

  useEffect(() => {
    if (!triggerRef.current || !preview) return;
    return watchPreview(triggerRef.current, setPreviewActive, open);
  }, [preview, open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  function close() {
    videoRef.current?.pause();
    dialogRef.current?.close();
    setOpen(false); // Unmounting also stops embedded players and their audio.
    triggerRef.current?.focus();
  }

  return <>
    <button ref={triggerRef} type="button" className="plan-demo-monitor"
      aria-label={`Ver demonstração do plano ${planName}`} aria-haspopup="dialog"
      onClick={() => {
        setFailed(false);
        setOpen(true);
        dialogRef.current?.showModal();
      }}>
      <span className="plan-demo-scenery" aria-hidden="true" />
      {thumbnail && <span className="plan-demo-thumbnail" aria-hidden="true" style={{ backgroundImage: `url("${thumbnail}")` }} />}
      {previewActive && !open && preview && <span className="plan-demo-preview" aria-hidden="true" inert><iframe src={preview} title={`Preview silencioso do plano ${planName}`} tabIndex={-1} allow="autoplay; encrypted-media" sandbox="allow-scripts allow-same-origin" referrerPolicy="strict-origin-when-cross-origin" /></span>}
      <span className="plan-demo-overlay"><span className="plan-demo-play"><Icon name="play" /></span><span>UM POUCO DO QUE TE ESPERA</span></span>
    </button>
    <dialog ref={dialogRef} className="demo-dialog" aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); close(); }}
      onClose={() => { videoRef.current?.pause(); setOpen(false); }}
      onClick={(event) => {
        const target = event.target as HTMLElement;
        if (target.closest(".demo-player, button")) return;
        close();
      }}>
      <div className="demo-dialog-heading"><h2 id={titleId}>Um pouco do que te espera <span>• {planName}</span></h2><button type="button" className="demo-close" aria-label="Fechar demonstração" onClick={close}>×</button></div>
      <div className="demo-player">
        {open && source && !failed ? demo?.type === "mp4"
          ? <video ref={videoRef} src={source} controls playsInline preload="metadata" aria-label={`Demonstração do plano ${planName}`} onError={() => setFailed(true)} />
          : <iframe src={source} title={`Demonstração do plano ${planName}`} allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowFullScreen sandbox="allow-scripts allow-same-origin allow-presentation" referrerPolicy="strict-origin-when-cross-origin" />
          : <div className="demo-placeholder"><Icon name="play" /><strong>{failed ? "Demonstração indisponível no momento" : "Demonstração em preparação"}</strong><p>{failed ? "Tente novamente mais tarde." : "Em breve, um pouco do que te espera por aqui."}</p></div>}
      </div>
      <p className="demo-disclaimer">Conteúdo demonstrativo. A disponibilidade pode variar.</p>
    </dialog>
  </>;
}
