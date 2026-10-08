export const REVIEW_MAX_LENGTH = 1000;
export const REVIEW_MIN_LENGTH = 10;
export function validateReview(rating: number, comment: string): string {
  const clean = comment.trim();
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error("Selecione uma nota de 1 a 5 estrelas.");
  if (clean.length < REVIEW_MIN_LENGTH || clean.length > REVIEW_MAX_LENGTH) throw new Error("Escreva um comentário entre 10 e 1.000 caracteres.");
  return clean;
}
