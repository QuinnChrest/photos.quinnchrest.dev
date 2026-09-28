import { useSyncExternalStore } from "react";

// Hash routes (#/p/<id>) so deep links work on GitHub Pages without a 404 fallback.

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

export function useOpenPhotoId() {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash);
  const match = hash.match(/^#\/p\/(.+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function photoHref(id: string) {
  return `#/p/${encodeURIComponent(id)}`;
}

// True when the lightbox was opened by clicking in the gallery, so closing it can
// just go back instead of stacking another history entry.
let openedFromGallery = false;

export function openPhoto(id: string) {
  openedFromGallery = true;
  window.location.hash = photoHref(id);
}

/** Prev/next inside the lightbox: swap the photo without growing history. */
export function replacePhoto(id: string) {
  history.replaceState(null, "", photoHref(id));
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

export function closePhoto() {
  if (openedFromGallery) {
    openedFromGallery = false;
    history.back();
    return;
  }
  history.replaceState(null, "", window.location.pathname + window.location.search);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}
