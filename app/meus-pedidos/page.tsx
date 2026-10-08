import { redirect } from "next/navigation";

// Keep old bookmarks working without exposing the previous commercial content.
export default function LegacyOrdersPage() {
  redirect("/");
}
