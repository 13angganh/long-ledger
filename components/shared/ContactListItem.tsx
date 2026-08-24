import Link from "next/link";
import type { Contact } from "@/lib/types/contact";
import { LastEditedBy } from "@/components/shared/LastEditedBy";
import { Badge } from "@/components/ui/Badge";
import { formatDateShortID } from "@/lib/format";

function daysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function ContactListItem({ contact }: { contact: Contact }) {
  const reminderDays = contact.reminderDate ? daysUntil(contact.reminderDate.toDate()) : null;
  const isOverdue = reminderDays !== null && reminderDays < 0;
  const isUpcoming = reminderDays !== null && reminderDays >= 0 && reminderDays <= 7;

  return (
    <Link
      href={`/contacts/${contact.id}`}
      className={`card-interactive flex items-center justify-between gap-3 rounded-control border border-border-hairline bg-bg-surface px-4 py-3.5 ${
        isOverdue || isUpcoming ? "halo-amber" : ""
      }`}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <span className="truncate text-sm font-medium text-text-primary">{contact.name}</span>
        <div className="flex flex-wrap items-center gap-1.5">
          {contact.relationship && (
            <span className="text-xs text-text-tertiary">{contact.relationship}</span>
          )}
          {contact.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} tone="neutral">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        {contact.reminderDate && (
          <span className={`text-xs ${isOverdue ? "text-danger" : "text-accent-amber"}`}>
            {isOverdue ? "Lewat · " : "Ingat · "}
            {formatDateShortID(contact.reminderDate.toDate())}
          </span>
        )}
        <LastEditedBy name={contact.lastEditedBy} />
      </div>
    </Link>
  );
}
