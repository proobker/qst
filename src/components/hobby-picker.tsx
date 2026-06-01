"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { addHobbyAction } from "@/app/actions/onboarding";
import { HOBBY_CATEGORIES } from "@/lib/constants";

type Hobby = { id: number; name: string };

type HobbyPickerProps = {
  hobbies: Hobby[];
  defaultSelectedIds: number[];
};

function buildCategoryByName(): Map<string, string> {
  const lookup = new Map<string, string>();
  for (const [category, names] of Object.entries(HOBBY_CATEGORIES)) {
    for (const name of names) {
      lookup.set(name, category);
    }
  }
  return lookup;
}

const categoryByName = buildCategoryByName();

function groupHobbies(hobbies: Hobby[]): Array<{ category: string; items: Hobby[] }> {
  const groups = new Map<string, Hobby[]>();

  for (const hobby of hobbies) {
    const category = categoryByName.get(hobby.name) ?? "Other";
    const bucket = groups.get(category) ?? [];
    bucket.push(hobby);
    groups.set(category, bucket);
  }

  return [...groups.entries()]
    .map(([category, items]) => ({
      category,
      items: items.sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.category.localeCompare(b.category));
}

export function HobbyPicker({ hobbies, defaultSelectedIds }: HobbyPickerProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [customName, setCustomName] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set(defaultSelectedIds));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const normalizedQuery = query.trim().toLowerCase();

  const filteredHobbies = useMemo(() => {
    if (!normalizedQuery) {
      return hobbies;
    }
    return hobbies.filter((hobby) => hobby.name.toLowerCase().includes(normalizedQuery));
  }, [hobbies, normalizedQuery]);

  const grouped = useMemo(() => groupHobbies(filteredHobbies), [filteredHobbies]);
  const selectedCount = selectedIds.size;

  const toggleHobby = (hobbyId: number) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(hobbyId)) {
        next.delete(hobbyId);
      } else {
        next.add(hobbyId);
      }
      return next;
    });
  };

  const addCustomHobby = () => {
    const trimmed = customName.trim();
    if (trimmed.length < 2) {
      setError("Enter at least 2 characters for a hobby.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await addHobbyAction(trimmed);
      if (!result.ok) {
        setError(result.message ?? "Could not add hobby.");
        return;
      }

      setCustomName("");
      setSelectedIds((current) => new Set([...current, result.hobby.id]));
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {Array.from(selectedIds).map((hobbyId) => (
        <input key={hobbyId} type="hidden" name="hobbies" value={hobbyId} />
      ))}

      <div className="relative">
        <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search hobbies..."
          className="w-full rounded-lg border border-border bg-background py-2 pr-3 pl-9 text-sm text-foreground outline-none transition focus:border-primary"
        />
      </div>

      <p className="text-sm text-muted">
        {selectedCount === 0
          ? "Select at least one hobby."
          : `${selectedCount} ${selectedCount === 1 ? "hobby" : "hobbies"} selected`}
      </p>

      <div className="max-h-96 space-y-4 overflow-y-auto pr-1">
        {grouped.length === 0 ? (
          <p className="text-sm text-muted">No hobbies match your search.</p>
        ) : (
          grouped.map((group) => (
            <section key={group.category} className="space-y-2">
              <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">{group.category}</h3>
              <div className="flex flex-wrap gap-2">
                {group.items.map((hobby) => {
                  const selected = selectedIds.has(hobby.id);
                  return (
                    <button
                      key={hobby.id}
                      type="button"
                      onClick={() => toggleHobby(hobby.id)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition ${
                        selected
                          ? "border-primary bg-primary/20 text-foreground"
                          : "border-border text-muted hover:border-primary hover:text-foreground"
                      }`}
                    >
                      {hobby.name}
                    </button>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>

      <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
        <p className="text-sm font-medium text-foreground">Add your own hobby</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={customName}
            onChange={(event) => setCustomName(event.target.value)}
            placeholder="e.g. Rock climbing"
            className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary"
          />
          <button
            type="button"
            onClick={addCustomHobby}
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary disabled:opacity-60"
          >
            <Plus size={14} />
            {isPending ? "Adding..." : "Add hobby"}
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
