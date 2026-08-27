"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { subscribeToContacts } from "@/lib/repositories/contactRepo";
import type { Contact } from "@/lib/types/contact";

interface UseContactsResult {
  contacts: Contact[];
  deletedContacts: Contact[];
  loading: boolean;
  error: string | null;
}

export function useContacts(): UseContactsResult {
  const { user } = useAuth();
  const [rawContacts, setRawContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToContacts(
      user.uid,
      (data) => {
        setRawContacts(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  const [syncedUser, setSyncedUser] = useState(user);
  if (user !== syncedUser) {
    setSyncedUser(user);
    setRawContacts([]);
    setLoading(user ? true : false);
  }

  const contacts = useMemo(
    () => rawContacts.filter((c) => c.deletedAt === null),
    [rawContacts]
  );
  const deletedContacts = useMemo(
    () => rawContacts.filter((c) => c.deletedAt !== null),
    [rawContacts]
  );

  return { contacts, deletedContacts, loading, error };
}
