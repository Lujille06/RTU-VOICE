import {randomInt} from 'crypto';

export const str = (v: FormDataEntryValue | null) => (v ?? "").toString();

// no I, O, 0 or 1, since students will read these out and type them
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateTrackingId(length: number = 5): string {
    let id = "";
    for (let i = 0; i < length; i++) {
        id += ALPHABET[randomInt(ALPHABET.length)];
    }
    return `STU-${id}`;
}