import { Gallery } from "./components/Gallery";
import { Lightbox } from "./components/Lightbox";
import photosJson from "./data/photos.json";
import type { Photo } from "./data/types";
import { useOpenPhotoId } from "./lib/useHashRoute";

const photos = photosJson as Photo[];

export default function App() {
  const openId = useOpenPhotoId();
  const openIndex = openId ? photos.findIndex((p) => p.id === openId) : -1;

  return (
    <>
      <header className="site-header">
        <h1>Quinn Chrest</h1>
        <p>Photos I like.</p>
      </header>

      <main>
        {photos.length > 0 ? (
          <Gallery photos={photos} />
        ) : (
          <p className="empty">
            No photos yet. Add originals to <code>originals/</code> and run <code>bun run process</code>.
          </p>
        )}
      </main>

      <footer className="site-footer">© {new Date().getFullYear()} Quinn Chrest</footer>

      {openIndex >= 0 && <Lightbox photos={photos} index={openIndex} />}
    </>
  );
}
