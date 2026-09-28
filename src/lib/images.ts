import { thumbHashToDataURL } from "thumbhash";
import type { Photo } from "../data/types";

// In dev, vite.config.ts serves .cache/out at /_img so photos work before anything is uploaded.
const IMG_BASE = (
  import.meta.env.VITE_IMG_BASE || (import.meta.env.DEV ? "/_img" : "https://img.quinnchrest.dev")
).replace(/\/$/, "");

export function imageUrl(photo: Photo, width: number, format: "avif" | "webp" | "jpg") {
  return `${IMG_BASE}/${photo.id}/${width}.${format}`;
}

export function srcSet(photo: Photo, format: "avif" | "webp" | "jpg") {
  return photo.widths.map((w) => `${imageUrl(photo, w, format)} ${w}w`).join(", ");
}

const placeholders = new Map<string, string>();

export function placeholder(photo: Photo) {
  let url = placeholders.get(photo.id);
  if (!url) {
    const bytes = Uint8Array.from(atob(photo.thumbhash), (c) => c.charCodeAt(0));
    url = thumbHashToDataURL(bytes);
    placeholders.set(photo.id, url);
  }
  return url;
}
