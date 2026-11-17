import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const DIR = path.resolve(process.env.UPLOAD_DIR ?? "./data/uploads");

export const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "application/pdf": "pdf",
};
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Enregistre un fichier dans le dossier privé et renvoie son nom (jamais servi publiquement). */
export async function saveUpload(file: File) {
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) throw new Error("type");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("size");
  await mkdir(DIR, { recursive: true });
  const name = `${randomBytes(16).toString("hex")}.${ext}`;
  await writeFile(path.join(DIR, name), Buffer.from(await file.arrayBuffer()), { mode: 0o600 });
  return name;
}

function safePath(name: string) {
  if (!/^[a-f0-9]{32}\.[a-z]+$/.test(name)) throw new Error("nom de fichier invalide");
  return path.join(DIR, name);
}

export async function readUpload(name: string) {
  return readFile(safePath(name));
}

export async function deleteUpload(name: string) {
  try {
    await unlink(safePath(name));
  } catch {
    /* déjà supprimé */
  }
}
