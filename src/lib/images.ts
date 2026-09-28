import { thumbHashToDataURL } from "thumbhash";
import type { Photo } from "../data/types";

// Variants live in public/img, which Vite serves in dev and copies into the build.
const IMG_BASE = `${import.meta.env.BASE_URL}img`;

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
