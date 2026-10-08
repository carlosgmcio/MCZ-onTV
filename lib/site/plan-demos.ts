import type { Plan } from "./plans";

export type PlanDemo = {
  type: "embed" | "mp4";
  url: string;
};

// Configure only videos you own or have permission to show.
// null keeps the cinematic placeholder; no player is loaded.
export const planDemos: Record<Plan["id"], PlanDemo | null> = {
  mensal: { type: "embed", url: "https://www.youtube.com/embed/GLp1eBhgKuw" },
  trimestral: { type: "embed", url: "https://www.youtube.com/embed/pILMPnUKlQI" },
  semestral: { type: "embed", url: "https://www.youtube.com/embed/2UFvjFrDlx0" },
  anual: { type: "embed", url: "https://www.youtube.com/embed/UuJ-wZTXEbk" },
};

export function demoSource(demo: PlanDemo | null): string | null {
  if (!demo?.url.trim()) return null;
  if (demo.type === "mp4") {
    return /^\/videos\/[a-zA-Z0-9_./-]+\.mp4$/.test(demo.url) && !demo.url.includes("..")
      ? demo.url : null;
  }
  try {
    const url = new URL(demo.url);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    // This source is mounted only after the visitor clicks the monitor.
    const isYouTube = url.hostname === "www.youtube.com" && url.pathname.startsWith("/embed/");
    url.searchParams.set("autoplay", isYouTube ? "1" : "0");
    if (isYouTube) {
      url.searchParams.set("playsinline", "1");
      url.searchParams.set("controls", "1");
    }
    return url.toString();
  } catch {
    return null;
  }
}

function youtubeId(demo: PlanDemo | null): string | null {
  if (demo?.type !== "embed") return null;
  try {
    const url = new URL(demo.url);
    return url.protocol === "https:" && url.hostname === "www.youtube.com"
      ? url.pathname.match(/^\/embed\/([\w-]{11})$/)?.[1] ?? null : null;
  } catch { return null; }
}

export function previewSource(demo: PlanDemo | null): string | null {
  const id = youtubeId(demo);
  if (!id || !demo) return null;
  const url = new URL(demo.url);
  for (const [key, value] of Object.entries({ autoplay: "1", mute: "1", controls: "0", playsinline: "1", loop: "1", playlist: id, disablekb: "1", fs: "0" })) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

export function previewThumbnail(demo: PlanDemo | null): string | null {
  const id = youtubeId(demo);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}
