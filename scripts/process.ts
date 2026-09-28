// Turns full-size originals into web-sized variants and updates the manifest
// the site reads. Runs locally only; never bundled into the site.
//
//   originals/<name>.jpg  ->  .cache/out/<id>/<width>.{avif,webp,jpg}
//                         ->  src/data/photos.json

import { mkdir, readdir, rm } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import exifr from "exifr";
import sharp, { type Sharp } from "sharp";
import { rgbaToThumbHash } from "thumbhash";
import { FORMATS, WIDTHS, type Exif, type Photo } from "../src/data/types";

const ORIGINALS_DIR = "originals";
const OUT_DIR = ".cache/out";
const MANIFEST = "src/data/photos.json";
const INPUT_EXTS = new Set([".jpg", ".jpeg", ".png", ".tif", ".tiff", ".webp", ".heic"]);

const ENCODERS: Record<(typeof FORMATS)[number], (img: Sharp) => Sharp> = {
  avif: (img) => img.avif({ quality: 50, effort: 4 }),
  webp: (img) => img.webp({ quality: 78 }),
  jpg: (img) => img.jpeg({ quality: 82, mozjpeg: true }),
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function contentHash(bytes: Uint8Array) {
  return new Bun.CryptoHasher("sha256").update(bytes).digest("hex").slice(0, 8);
}

function variantWidths(width: number) {
  const widths: number[] = WIDTHS.filter((w) => w < width);
  widths.push(Math.min(width, WIDTHS[WIDTHS.length - 1]));
  return [...new Set(widths)];
}

function formatShutter(seconds: number) {
  return seconds >= 1 ? `${seconds}s` : `1/${Math.round(1 / seconds)}s`;
}

// EXIF dates have no timezone and exifr parses them as local time; keep that
// wall-clock time (no "Z") so every viewer sees the day the photo was taken.
function localTimestamp(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

async function readExif(bytes: Uint8Array): Promise<Exif> {
  const raw = await exifr
    .parse(Buffer.from(bytes), {
      pick: ["Make", "Model", "LensModel", "FocalLength", "FNumber", "ExposureTime", "ISO", "DateTimeOriginal"],
    })
    .catch(() => undefined);
  if (!raw) return {};

  const make: string | undefined = raw.Make?.trim();
  const model: string | undefined = raw.Model?.trim();
  // Many cameras repeat the make inside the model ("Canon Canon EOS R6").
  const camera = model && make && !model.toLowerCase().startsWith(make.toLowerCase()) ? `${make} ${model}` : model ?? make;

  return {
    camera,
    lens: raw.LensModel?.trim(),
    focalLength: raw.FocalLength ? `${Math.round(raw.FocalLength)}mm` : undefined,
    aperture: raw.FNumber ? `ƒ/${raw.FNumber}` : undefined,
    shutter: raw.ExposureTime ? formatShutter(raw.ExposureTime) : undefined,
    iso: raw.ISO,
    takenAt: raw.DateTimeOriginal instanceof Date ? localTimestamp(raw.DateTimeOriginal) : undefined,
  };
}

async function thumbhash(bytes: Uint8Array) {
  const { data, info } = await sharp(bytes)
    .autoOrient()
    .resize(100, 100, { fit: "inside" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return Buffer.from(rgbaToThumbHash(info.width, info.height, data)).toString("base64");
}

async function variantsExist(id: string, widths: number[]) {
  const checks = widths.flatMap((w) => FORMATS.map((f) => Bun.file(join(OUT_DIR, id, `${w}.${f}`)).exists()));
  return (await Promise.all(checks)).every(Boolean);
}

async function processPhoto(file: string, previous: Photo | undefined): Promise<Photo> {
  const bytes = await Bun.file(join(ORIGINALS_DIR, file)).bytes();
  const id = `${slugify(basename(file, extname(file)))}-${contentHash(bytes)}`;

  const meta = await sharp(bytes).metadata();
  const rotated = (meta.orientation ?? 1) >= 5;
  const width = rotated ? meta.height : meta.width;
  const height = rotated ? meta.width : meta.height;
  const widths = variantWidths(width);

  // Keep hand-written fields even when the original was re-exported.
  const base = { title: previous?.title ?? "", caption: previous?.caption ?? "", tags: previous?.tags ?? [] };

  if (previous?.id === id && (await variantsExist(id, widths))) {
    console.log(`  skip  ${file}`);
    return { ...previous, ...base };
  }

  console.log(`  build ${file} -> ${id} (${widths.join(", ")})`);
  const dir = join(OUT_DIR, id);
  await mkdir(dir, { recursive: true });
  await Promise.all(
    widths.flatMap((w) =>
      FORMATS.map((f) =>
        ENCODERS[f](sharp(bytes).autoOrient().resize({ width: w, withoutEnlargement: true })).toFile(join(dir, `${w}.${f}`)),
      ),
    ),
  );

  return {
    id,
    source: file,
    width,
    height,
    widths,
    thumbhash: await thumbhash(bytes),
    exif: await readExif(bytes),
    ...base,
  };
}

async function loadManifest(): Promise<Photo[]> {
  const file = Bun.file(MANIFEST);
  return (await file.exists()) ? await file.json() : [];
}

async function main() {
  await mkdir(ORIGINALS_DIR, { recursive: true });
  const files = (await readdir(ORIGINALS_DIR)).filter((f) => INPUT_EXTS.has(extname(f).toLowerCase())).sort();
  if (files.length === 0) {
    console.log(`No photos in ${ORIGINALS_DIR}/ — drop some originals there and re-run.`);
  }

  const previous = new Map((await loadManifest()).map((p) => [p.source, p]));
  const photos: Photo[] = [];
  // One at a time: AVIF encoding already saturates the CPU.
  for (const file of files) photos.push(await processPhoto(file, previous.get(file)));

  // Newest first; undated photos go last.
  photos.sort((a, b) => (b.exif.takenAt ?? "").localeCompare(a.exif.takenAt ?? ""));

  // Drop variants for photos that were removed or re-exported.
  const keep = new Set(photos.map((p) => p.id));
  for (const dir of await readdir(OUT_DIR).catch(() => [])) {
    if (!keep.has(dir)) await rm(join(OUT_DIR, dir), { recursive: true, force: true });
  }

  await Bun.write(MANIFEST, JSON.stringify(photos, null, 2) + "\n");
  console.log(`Wrote ${photos.length} photo(s) to ${MANIFEST}`);
}

await main();
