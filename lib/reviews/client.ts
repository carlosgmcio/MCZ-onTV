import { collection, doc, getDoc, getFirestore, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { getFirebaseAuth } from "../firebase/client";
import { validateReview } from "./validation";

export type PublicReview = { id: string; publicName: string; photoURL: string; rating: number; comment: string; createdAt: Date };
function database() { return getFirestore(getFirebaseAuth().app); }

export function observeApprovedReviews(next: (reviews: PublicReview[]) => void, fail: () => void) {
  const approved = query(collection(database(), "reviews"), where("status", "==", "approved"), orderBy("createdAt", "desc"), limit(24));
  return onSnapshot(approved, (snapshot) => {
    next(snapshot.docs.flatMap((document) => {
      const data = document.data();
      if (data.status !== "approved" || typeof data.publicName !== "string" || typeof data.comment !== "string" || !Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5 || !data.createdAt?.toDate) return [];
      return [{ id: document.id, publicName: data.publicName, photoURL: typeof data.photoURL === "string" && /^https:\/\/[^/]*googleusercontent\.com\//.test(data.photoURL) ? data.photoURL : "", rating: data.rating, comment: data.comment, createdAt: data.createdAt.toDate() }];
    }));
  }, fail);
}

// No caller-supplied UID, name, email or moderation fields.
export async function submitReview(rating: number, comment: string, sharePhoto: boolean): Promise<void> {
  const clean = validateReview(rating, comment);
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Entre com Google para enviar sua avaliação.");
  const token = await user.getIdTokenResult();
  if (token.signInProvider !== "google.com") throw new Error("Entre com Google para enviar sua avaliação.");
  const name = typeof token.claims.name === "string" ? token.claims.name.split(" ")[0] : "";
  if (!name || name.length > 80) throw new Error("Não foi possível confirmar seu nome público. Entre novamente com Google.");
  const reference = doc(database(), "reviews", user.uid);
  if ((await getDoc(reference)).exists()) throw new Error("Você já enviou uma avaliação. Cada conta pode enviar uma avaliação.");
  const picture = typeof token.claims.picture === "string" ? token.claims.picture : "";
  await setDoc(reference, { userId: user.uid, publicName: name, photoURL: sharePhoto ? picture : "", rating, comment: clean, createdAt: serverTimestamp(), status: "approved" });
}
