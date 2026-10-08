"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth } from "./auth/auth-provider";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { observeApprovedReviews, submitReview, type PublicReview } from "@/lib/reviews/client";
import { REVIEW_MAX_LENGTH, REVIEW_MIN_LENGTH } from "@/lib/reviews/validation";

const intentKey = "mcz-review-intent";
export function Reviews() {
  const { user, loading: authLoading, busy: authBusy, error: authError, loginWithGoogle } = useAuth();
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [sharePhoto, setSharePhoto] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const sending = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let disposed = false;
    let unsubscribe: (() => void) | undefined;
    Promise.resolve().then(() => {
      if (disposed) return;
      if (!isFirebaseConfigured) { setLoading(false); setUnavailable(true); return; }
      unsubscribe = observeApprovedReviews((items) => { if (!disposed) { setReviews(items); setLoading(false); setUnavailable(false); } }, () => { if (!disposed) { setReviews([]); setLoading(false); setUnavailable(true); } });
    }).catch(() => { if (!disposed) { setLoading(false); setUnavailable(true); } });
    return () => { disposed = true; unsubscribe?.(); };
  }, [user?.uid]);

  useEffect(() => {
    if (!user) return;
    try {
      if (sessionStorage.getItem(intentKey) === "yes") {
        sessionStorage.removeItem(intentKey);
        dialog.current?.showModal();
      }
    } catch { /* Storage is optional; the button remains available. */ }
  }, [user]);

  function close() { dialog.current?.close(); trigger.current?.focus(); }
  async function start() {
    if (user) { dialog.current?.showModal(); return; }
    try { sessionStorage.setItem(intentKey, "yes"); } catch { /* Optional intent preservation. */ }
    await loginWithGoogle();
  }
  async function send(event: FormEvent) {
    event.preventDefault();
    if (sending.current || !user) return;
    sending.current = true; setBusy(true); setError("");
    try { await submitReview(rating, comment, sharePhoto); setSent(true); }
    catch (failure) {
      const code = failure && typeof failure === "object" && "code" in failure ? failure.code : null;
      setError(code ? "Não foi possível enviar. Confira sua conexão ou tente mais tarde. Se já enviou, cada conta pode avaliar apenas uma vez." : failure instanceof Error ? failure.message : "Não foi possível enviar sua avaliação.");
    } finally { sending.current = false; setBusy(false); }
  }

  return <section className="reviews-section container" aria-labelledby="reviews-title">
    <div className="reviews-heading"><div><h2 id="reviews-title">⭐ O que nossos clientes dizem</h2><p>Experiências compartilhadas por clientes da MCZ onTV.</p></div><button ref={trigger} type="button" className="primary-button" disabled={authLoading || authBusy || !isFirebaseConfigured} onClick={() => void start()}>⭐ DEIXAR MINHA AVALIAÇÃO</button></div>
    {!user && <p className="reviews-note">Entre com Google para enviar sua avaliação.</p>}
    {authError && <p role="alert" className="auth-error">{authError}</p>}
    {loading ? <p role="status" className="reviews-note">Carregando avaliações…</p> : unavailable ? <p role="status" className="reviews-note">As avaliações estão indisponíveis no momento.</p> : !reviews.length ? <p className="reviews-empty">Ainda não há avaliações publicadas. Compartilhe sua experiência.</p> : <div className="reviews-grid">{reviews.map((review) => <article key={review.id} className="review-card"><div className="review-author">{review.photoURL ? <span className="review-photo" aria-hidden="true" style={{ backgroundImage: `url("${review.photoURL}")` }} /> : <span className="review-photo" aria-hidden="true">{review.publicName.slice(0, 1)}</span>}<div><h3>{review.publicName}</h3><time dateTime={review.createdAt.toISOString()}>{review.createdAt.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}</time></div></div><p className="review-stars" aria-label={`${review.rating} de 5 estrelas`}>{"★".repeat(review.rating)}<span aria-hidden="true">{"☆".repeat(5 - review.rating)}</span></p><p className="review-comment">{review.comment}</p></article>)}</div>}
    <dialog ref={dialog} className="review-dialog" aria-labelledby="review-question" onCancel={(event) => { event.preventDefault(); close(); }} onClick={(event) => { if (event.target === event.currentTarget) { const box = event.currentTarget.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) close(); } }}>
      <button type="button" className="demo-close review-close" onClick={close} aria-label="Fechar avaliação">×</button>
      <h2 id="review-question">Como você avalia sua experiência com a MCZ onTV?</h2>
      {sent ? <p role="status" className="review-thanks">Obrigado! 💙 Sua avaliação foi publicada com sucesso.</p> : <form onSubmit={send}>
        <fieldset disabled={busy}><legend>Selecione sua nota</legend><div className="review-rating">{[1, 2, 3, 4, 5].map((value) => <label key={value}><input type="radio" name="review-rating" value={value} checked={rating === value} onChange={() => setRating(value)} required /><span aria-hidden="true" className={value <= rating ? "selected" : ""}>★</span><span className="sr-only">{value} {value === 1 ? "estrela" : "estrelas"}</span></label>)}</div></fieldset>
        <label className="review-label" htmlFor="review-comment">Seu comentário</label><textarea id="review-comment" value={comment} onChange={(event) => setComment(event.target.value)} minLength={REVIEW_MIN_LENGTH} maxLength={REVIEW_MAX_LENGTH} rows={5} required disabled={busy} aria-describedby="review-privacy" />
        <p className="reviews-note">{comment.length}/{REVIEW_MAX_LENGTH} caracteres</p><p id="review-privacy" className="reviews-note">Seu primeiro nome e comentário serão públicos ao enviar a avaliação. Não inclua dados pessoais no comentário. Seu e-mail não será publicado.</p>
        {user?.photoURL && <label className="review-photo-choice"><input type="checkbox" checked={sharePhoto} onChange={(event) => setSharePhoto(event.target.checked)} disabled={busy} /> Autorizar publicação da minha foto do Google.</label>}
        <p className="reviews-note">Uma avaliação por conta Google. O login não comprova uma contratação.</p>
        {error && <p className="auth-error" role="alert">{error}</p>}<button type="submit" className="primary-button" disabled={busy || !user || !rating} aria-busy={busy}>{busy ? "ENVIANDO…" : "ENVIAR AVALIAÇÃO"}</button>
      </form>}
    </dialog>
  </section>;
}
