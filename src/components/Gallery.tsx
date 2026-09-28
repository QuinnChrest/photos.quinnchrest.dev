import type { Photo as PhotoData } from "../data/types";
import { openPhoto, photoHref } from "../lib/useHashRoute";
import { Photo } from "./Photo";

// Justified rows: each tile grows in proportion to its aspect ratio, so every
// photo in a row ends up the same height without any layout JS.
export function Gallery({ photos }: { photos: PhotoData[] }) {
  return (
    <ul className="gallery">
      {photos.map((photo, i) => {
        const ratio = photo.width / photo.height;
        return (
          <li key={photo.id} style={{ "--ratio": ratio } as React.CSSProperties}>
            <a
              href={photoHref(photo.id)}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                openPhoto(photo.id);
              }}
            >
              <Photo
                photo={photo}
                eager={i < 6}
                sizes={`(max-width: 640px) 100vw, ${Math.round(ratio * 340)}px`}
              />
              {photo.title && <span className="gallery-title">{photo.title}</span>}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
