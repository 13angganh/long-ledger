"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { subscribeToContacts } from "@/lib/repositories/contactRepo";
import type { Contact } from "@/lib/types/contact";

interface UseContactsResult {
  contacts: Contact[];
  loading: boolean;
  error: string | null;
}

export function useContacts(): UseContactsResult {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToContacts(
      user.uid,
      (data) => {
        setContacts(data);
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
    setContacts([]);
    setLoading(user ? true : false);
  }

  return { contacts, loading, error };
}
