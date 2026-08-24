import type { Contact } from "@/lib/types/contact";

/**
 * SATU-SATUNYA lapisan yang menghitung logic agregasi/turunan/search untuk
 * data contact (Bagian 4.2). Dashboard DAN /contacts sama-sama panggil
 * fungsi di sini.
 */

/**
 * Search lintas field: nama, relationship, tags, catatan (Bagian 5: search
 * PALING prominent di /contacts). Case-insensitive, substring match.
 */
export function searchContacts(contacts: Contact[], query: string): Contact[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return contacts;

  return contacts.filter((c) => {
    const haystack = [
      c.name,
      c.relationship,
      c.note,
      ...c.tags,
      ...c.phones.map((p) => p.number),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(trimmed);
  });
}

/** Filter kontak yang punya salah satu dari tag yang diberikan. */
export function filterByTags(contacts: Contact[], tags: string[]): Contact[] {
  if (tags.length === 0) return contacts;
  return contacts.filter((c) => tags.some((t) => c.tags.includes(t)));
}

function daysUntil(date: Date, from: Date = new Date()): number {
  return Math.ceil((date.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

/** Kontak dengan reminderDate yang sudah lewat (overdue) — untuk halo amber. */
export function getOverdueReminders(
  contacts: Contact[],
  referenceDate: Date = new Date()
): Contact[] {
  return contacts.filter((c) => {
    if (!c.reminderDate) return false;
    return daysUntil(c.reminderDate.toDate(), referenceDate) < 0;
  });
}

const UPCOMING_REMINDER_DAYS = 7;

/** Kontak dengan reminderDate dalam ≤7 hari ke depan (belum overdue). */
export function getUpcomingReminders(
  contacts: Contact[],
  referenceDate: Date = new Date()
): Contact[] {
  return contacts.filter((c) => {
    if (!c.reminderDate) return false;
    const days = daysUntil(c.reminderDate.toDate(), referenceDate);
    return days >= 0 && days <= UPCOMING_REMINDER_DAYS;
  });
}

/**
 * Kontak dengan reminder terdekat (overdue diprioritaskan, lalu upcoming),
 * diurut ascending by reminderDate, dibatasi `limit`.
 */
export function getNearestReminders(
  contacts: Contact[],
  limit = 3
): Contact[] {
  return contacts
    .filter((c) => c.reminderDate !== null)
    .sort((a, b) => a.reminderDate!.toMillis() - b.reminderDate!.toMillis())
    .slice(0, limit);
}
