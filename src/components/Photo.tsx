import { useState } from "react";
import type { Photo as PhotoData } from "../data/types";
import { imageUrl, placeholder, srcSet } from "../lib/images";

type Props = {
  photo: PhotoData;
  sizes: string;
  eager?: boolean;
  className?: string;
};

export function Photo({ photo, sizes, eager = false, className = "" }: Props) {
  const [loaded, setLoaded] = useState(false);
  const largest = photo.widths[photo.widths.length - 1];

  return (
    <picture
      className={`photo ${loaded ? "is-loaded" : ""} ${className}`}
      style={{ backgroundImage: `url(${placeholder(photo)})` }}
    >
      <source type="image/avif" srcSet={srcSet(photo, "avif")} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet(photo, "webp")} sizes={sizes} />
      <img
        src={imageUrl(photo, largest, "jpg")}
        srcSet={srcSet(photo, "jpg")}
        sizes={sizes}
        width={photo.width}
        height={photo.height}
        alt={photo.title || photo.caption || ""}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        // A cached image can finish before React attaches onLoad.
        ref={(img) => {
          if (img?.complete && img.naturalWidth > 0) setLoaded(true);
        }}
        onLoad={() => setLoaded(true)}
      />
    </picture>
  );
}
