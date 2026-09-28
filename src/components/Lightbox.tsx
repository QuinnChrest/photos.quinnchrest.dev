import { useEffect, useRef } from "react";
import type { Photo as PhotoData } from "../data/types";
import { closePhoto, replacePhoto } from "../lib/useHashRoute";
import { Photo } from "./Photo";

type Props = {
  photos: PhotoData[];
  index: number;
};

export function Lightbox({ photos, index }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const touchStart = useRef<number | null>(null);
  const photo = photos[index];
  const prev = photos[index - 1];
  const next = photos[index + 1];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    document.body.classList.add("no-scroll");
    return () => document.body.classList.remove("no-scroll");
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" && prev) replacePhoto(prev.id);
      if (e.key === "ArrowRight" && next) replacePhoto(next.id);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next]);

  const { exif } = photo;
  const settings = [exif.focalLength, exif.aperture, exif.shutter, exif.iso && `ISO ${exif.iso}`].filter(Boolean);
  const date = exif.takenAt
    ? new Date(exif.takenAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <dialog
      ref={dialogRef}
      className="lightbox"
      aria-label={photo.title || "Photo"}
      onCancel={(e) => {
        e.preventDefault();
        closePhoto();
      }}
      onClick={(e) => {
        // Clicks on the backdrop area (not the photo or controls) close it.
        if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains("lightbox-stage")) closePhoto();
      }}
      onTouchStart={(e) => (touchStart.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchStart.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStart.current;
        touchStart.current = null;
        if (dx > 50 && prev) replacePhoto(prev.id);
        if (dx < -50 && next) replacePhoto(next.id);
      }}
    >
      <div className="lightbox-stage">
        <Photo key={photo.id} photo={photo} sizes="100vw" eager className="lightbox-photo" />
      </div>

      <button className="lightbox-btn lightbox-close" onClick={closePhoto} aria-label="Close">
        ×
      </button>
      {prev && (
        <button className="lightbox-btn lightbox-prev" onClick={() => replacePhoto(prev.id)} aria-label="Previous photo">
          ‹
        </button>
      )}
      {next && (
        <button className="lightbox-btn lightbox-next" onClick={() => replacePhoto(next.id)} aria-label="Next photo">
          ›
        </button>
      )}

      <footer className="lightbox-info">
        <div>
          {photo.title && <h2>{photo.title}</h2>}
          {photo.caption && <p>{photo.caption}</p>}
        </div>
        <ul className="lightbox-exif">
          {exif.camera && <li>{exif.camera}</li>}
          {exif.lens && <li>{exif.lens}</li>}
          {settings.length > 0 && <li>{settings.join(" · ")}</li>}
          {date && <li>{date}</li>}
        </ul>
      </footer>

      {/* Warm the cache for neighbours so arrowing through feels instant. */}
      <div hidden>
        {[prev, next].filter(Boolean).map((p) => (
          <Photo key={p!.id} photo={p!} sizes="100vw" eager />
        ))}
      </div>
    </dialog>
  );
}
