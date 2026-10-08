import Link from "next/link";
import { Icon } from "./ui-icon";

export function Brand({ href = "/" }: { href?: string }) {
  return <Link href={href} className="brand" aria-label="MCZ onTV — Início">
    <span className="brand-symbol"><Icon name="tv" /></span>
    <span>MCZ <span className="brand-ontv">on<span>TV</span></span></span>
  </Link>;
}
