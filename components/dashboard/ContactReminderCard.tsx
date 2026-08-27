"use client";

import { useContacts } from "@/lib/hooks/useContacts";
import {
  getOverdueReminders,
  getUpcomingReminders,
  getNearestReminders,
} from "@/lib/selectors/contactSelectors";
import { SummaryCard } from "./SummaryCard";
import { LastEditedBy } from "@/components/shared/LastEditedBy";
import { ContactsIcon } from "@/components/ui/icons";
import { formatDateShortID } from "@/lib/format";

/**
 * Bagian 7: halo amber kalau ada reminder jatuh tempo/lewat + list kontak
 * dengan reminder terdekat. Logic 100% dari contactSelectors.
 */
export function ContactReminderCard() {
  const { contacts, loading } = useContacts();

  if (loading) {
    return (
      <div className="h-[220px] animate-pulse rounded-card border border-border-hairline bg-bg-surface" />
    );
  }

  const overdue = getOverdueReminders(contacts);
  const upcoming = getUpcomingReminders(contacts);
  const nearest = getNearestReminders(contacts, 3);
  const isUrgent = overdue.length > 0 || upcoming.length > 0;

  return (
    <SummaryCard
      href="/contacts"
      title="Kontak"
      icon={<ContactsIcon />}
      urgent={isUrgent}
    >
      {nearest.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          {nearest.map((contact) => (
            <div key={contact.id} className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm text-text-primary">{contact.name}</span>
                <span className="shrink-0 text-xs text-text-tertiary">
                  {formatDateShortID(contact.reminderDate!.toDate())}
                </span>
              </div>
              <div className="flex justify-end">
                <LastEditedBy name={contact.lastEditedBy} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-secondary">Tidak ada pengingat follow-up.</p>
      )}

      {isUrgent && (
        <p className="border-t border-border-hairline pt-3 text-xs text-accent-amber">
          {overdue.length > 0 && `${overdue.length} reminder lewat. `}
          {upcoming.length > 0 && `${upcoming.length} reminder ≤7 hari.`}
        </p>
      )}
    </SummaryCard>
  );
}
