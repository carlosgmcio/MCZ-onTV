import type { ReactNode } from "react";
const shapes: Record<string, ReactNode> = {
  tv: <><rect x="2" y="4" width="20" height="14" rx="3" /><path d="M8 22h8M12 18v4" /></>,
  play: <path d="m9 5 11 7-11 7V5Z" fill="currentColor" stroke="none" />,
  check: <path d="m5 12 4 4L19 6" />,
  sparkles: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" /><path d="M20 2v4M18 4h4" /></>,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  growth: <path d="m3 17 6-6 4 4 8-10m-6 0h6v6" />,
  shield: <>
    <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" />
    <path d="m8 12 3 3 5-6" />
  </>,
  bolt: <path d="m13 2-9 12h7l-1 8 10-13h-7l1-7Z" />,
  chat: <>
    <path d="M21 11.5a9 9 0 0 1-13 8L3 21l1.5-5A9 9 0 1 1 21 11.5Z" />
    <path d="M8 8c0 4 4 8 8 8l1-3-3-1-1 1-2-2 1-1-1-3-3 1Z" />
  </>,
  cart: <>
    <path d="M3 3h2l3 12h11l2-9H6" />
    <circle cx="9" cy="20" r="1" />
    <circle cx="18" cy="20" r="1" />
  </>,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  users: <>
    <circle cx="10" cy="8" r="3" />
    <path d="M3 21v-3a7 7 0 0 1 14 0v3M16 5a3 3 0 0 1 0 6M20 21v-3a7 7 0 0 0-3-6" />
  </>,
  instagram: <>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <path d="M17.5 6.5h.01" />
  </>,
  youtube: <>
    <rect x="2" y="5" width="20" height="14" rx="4" />
    <path d="m10 9 5 3-5 3V9Z" fill="currentColor" stroke="none" />
  </>,
  facebook: <path d="M14 22V13h3l.5-4H14V6.5c0-1 .5-1.5 1.5-1.5H18V1h-3c-4 0-6 2-6 6v2H6v4h3v9" fill="currentColor" stroke="none" />,
  tiktok: <path d="M14 3h3c.5 3 2 4 4 4v3a9 9 0 0 1-4-1v8a6 6 0 1 1-6-6v3a3 3 0 1 0 3 3V3Z" fill="currentColor" stroke="none" />,
  kwai: <>
    <rect x="4" y="10" width="12" height="11" rx="3" />
    <circle cx="7" cy="5" r="3" />
    <circle cx="14" cy="5" r="3" />
    <path d="m16 14 5-3v10l-5-3M8 14h4M8 17h4" />
  </>,
};
export function Icon({ name }: { name: string }) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[name]}</svg>;
}
