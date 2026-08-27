/**
 * Greeting dashboard (Poin 4 permintaan user): bervariasi per slot waktu,
 * bukan flat "Selamat pagi/siang/sore/malam" terus-menerus. Dipilih
 * pseudo-random tapi STABIL per hari (pakai tanggal sebagai seed) — supaya
 * tidak berubah tiap kali halaman di-refresh dalam hari yang sama, cukup
 * berganti nuansa dari hari ke hari.
 */

const MORNING = [
  "Selamat pagi",
  "Pagi",
  "Met pagi",
  "Halo, selamat pagi",
];

const AFTERNOON = [
  "Selamat siang",
  "Siang",
  "Halo, semoga harimu lancar",
];

const EVENING = [
  "Selamat sore",
  "Sore",
  "Halo, sore ini gimana?",
];

const NIGHT = [
  "Selamat malam",
  "Malam",
  "Halo, masih sempat mampir malam-malam",
];

function pickBySeed(options: string[], seed: number): string {
  return options[seed % options.length];
}

/** Seed dari tanggal (bukan waktu) supaya stabil sepanjang hari yang sama. */
function daySeed(date: Date): number {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}

export function getGreeting(referenceDate: Date = new Date()): string {
  const hour = referenceDate.getHours();
  const seed = daySeed(referenceDate);

  if (hour < 11) return pickBySeed(MORNING, seed);
  if (hour < 15) return pickBySeed(AFTERNOON, seed);
  if (hour < 18) return pickBySeed(EVENING, seed);
  return pickBySeed(NIGHT, seed);
}

/**
 * Nama tampilan singkat dari akun Google — first name saja kalau ada lebih
 * dari satu kata, supaya greeting tidak kepanjangan ("Selamat pagi, Angga"
 * lebih pas daripada nama lengkap KTP).
 */
export function getFirstName(displayName: string | null): string | null {
  if (!displayName) return null;
  return displayName.trim().split(/\s+/)[0];
}
