"use client";

import { useState, useEffect, useCallback } from "react";

interface ListAttribute {
  id: string;
  slug: string;
  title: string;
  type: string;
  config: unknown;
  sortOrder: number;
}

interface ListData {
  id: string;
  objectId: string;
  name: string;
  slug: string;
  isPrivate: boolean;
  objectSlug: string;
  objectName: string;
  objectPluralName: string;
  attributes: ListAttribute[];
  entryCount: number;
}

interface ListEntry {
  id: string;
  recordId: string;
  recordDisplayName: string;
  recordObjectSlug: string;
  createdAt: string;
  listValues: Record<string, unknown>;
}

export function useList(listId: string) {
  const [list, setList] = useState<ListData | null>(null);
  const [entries, setEntries] = useState<ListEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, entriesRes] = await Promise.all([
        fetch(`/api/v1/lists/${listId}`),
        fetch(`/api/v1/lists/${listId}/entries?limit=200`),
      ]);

      if (listRes.ok) {
        const data = await listRes.json();
        setList(data.data);
      }

      if (entriesRes.ok) {
        const data = await entriesRes.json();
        setEntries(data.data.entries);
        setTotal(data.data.pagination.total);
      }
    } finally {
      setLoading(false);
    }
  }, [listId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addEntry = useCallback(
    async (recordId: string) => {
      const res = await fetch(`/api/v1/lists/${listId}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordId }),
      });
      if (res.ok) {
        fetchData();
      }
    },
    [listId, fetchData]
  );

  const removeEntry = useCallback(
    async (entryId: string) => {
      await fetch(`/api/v1/lists/${listId}/entries/${entryId}`, {
        method: "DELETE",
      });
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
      setTotal((prev) => prev - 1);
    },
    [listId]
  );

  const updateEntryValues = useCallback(
    async (entryId: string, values: Record<string, unknown>) => {
      // Optimistic update
      setEntries((prev) =>
        prev.map((e) =>
          e.id === entryId
            ? { ...e, listValues: { ...e.listValues, ...values } }
            : e
        )
      );

      await fetch(`/api/v1/lists/${listId}/entries/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      });
    },
    [listId]
  );

  return {
    list,
    entries,
    total,
    loading,
    fetchData,
    addEntry,
    removeEntry,
    updateEntryValues,
  };
}
