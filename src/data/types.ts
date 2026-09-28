// Shared between the site and scripts/process.ts.

export const WIDTHS = [640, 1280, 2048] as const;
export const FORMATS = ["avif", "webp", "jpg"] as const;

export type Exif = {
  camera?: string;
  lens?: string;
  focalLength?: string;
  aperture?: string;
  shutter?: string;
  iso?: number;
  takenAt?: string;
};

export type Photo = {
  /** Folder name in the bucket: slug of the filename + content hash. */
  id: string;
  /** Original filename in originals/, used to carry hand-written fields across re-exports. */
  source: string;
  width: number;
  height: number;
  /** Widths that were actually generated (never wider than the original). */
  widths: number[];
  /** Base64 ThumbHash, decoded client-side into a blurred placeholder. */
  thumbhash: string;
  exif: Exif;
  title: string;
  caption: string;
  tags: string[];
};
