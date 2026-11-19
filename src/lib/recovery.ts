import "server-only";
import { randomInt } from "node:crypto";

// Sans I, L, O, 0 et 1 pour éviter les confusions à la lecture.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const RECOVERY_LENGTH = 12;

/** Code de récupération lisible : XXXX-XXXX-XXXX (environ 59 bits). */
export function newRecoveryCode() {
  let s = "";
  for (let i = 0; i < RECOVERY_LENGTH; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return s.match(/.{4}/g)!.join("-");
}

/** Accepte minuscules, espaces et tirets saisis par l'utilisateur. */
export function normalizeRecoveryCode(input: string) {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}
