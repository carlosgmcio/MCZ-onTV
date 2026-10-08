// A shared scheduler limits mobile playback to one visible monitor.
type Preview = { near: boolean; ratio: number; blocked: boolean; active: boolean; notify: (active: boolean) => void };
const previews = new Map<Element, Preview>();
let nearObserver: IntersectionObserver | undefined;
let visibleObserver: IntersectionObserver | undefined;
let mobile: MediaQueryList;
let reducedMotion: MediaQueryList;

export function activePreviewIndexes(items: { near: boolean; ratio: number; blocked: boolean }[], isMobile: boolean, reduced: boolean, hidden: boolean): number[] {
  if (reduced || hidden || items.some((item) => item.blocked)) return [];
  if (!isMobile) return items.flatMap((item, index) => item.near ? [index] : []);
  let best = -1;
  items.forEach((item, index) => {
    if (item.ratio > 0 && (best < 0 || item.ratio > items[best].ratio)) best = index;
  });
  return best < 0 ? [] : [best];
}

function refresh() {
  const entries = Array.from(previews.values());
  const active = activePreviewIndexes(entries, mobile.matches, reducedMotion.matches, document.hidden);
  entries.forEach((entry, index) => {
    const next = active.includes(index);
    if (entry.active !== next) { entry.active = next; entry.notify(next); }
  });
}

function setup() {
  mobile = window.matchMedia("(max-width: 767px)");
  reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  nearObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const preview = previews.get(entry.target);
      if (preview) preview.near = entry.isIntersecting;
    }
    refresh();
  }, { rootMargin: "160px 0px" });
  visibleObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const preview = previews.get(entry.target);
      if (preview) preview.ratio = entry.isIntersecting ? entry.intersectionRatio : 0;
    }
    refresh();
  }, { threshold: [0, .1, .25, .5, .75, 1] });
  mobile.addEventListener("change", refresh);
  reducedMotion.addEventListener("change", refresh);
  document.addEventListener("visibilitychange", refresh);
}

export function watchPreview(element: Element, notify: (active: boolean) => void, blocked: boolean): () => void {
  notify(false);
  // Safe static fallback in browsers without IntersectionObserver.
  if (!("IntersectionObserver" in window)) return () => {};
  if (!previews.size) setup();
  previews.set(element, { near: false, ratio: 0, blocked, active: false, notify });
  nearObserver?.observe(element);
  visibleObserver?.observe(element);
  refresh();
  return () => {
    nearObserver?.unobserve(element);
    visibleObserver?.unobserve(element);
    previews.delete(element);
    if (previews.size) { refresh(); return; }
    nearObserver?.disconnect();
    visibleObserver?.disconnect();
    mobile.removeEventListener("change", refresh);
    reducedMotion.removeEventListener("change", refresh);
    document.removeEventListener("visibilitychange", refresh);
  };
}
