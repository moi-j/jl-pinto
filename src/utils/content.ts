type DatedEntry = {
  data: {
    publishedDate?: Date;
    publishedYear?: number;
    eventDate?: Date;
    performanceDate?: Date;
  };
};

export function isPublished(entry: { data: { draft?: boolean } }): boolean {
  return entry.data.draft !== true;
}

/** URL slug for a content entry (Content Layer `id` is the filename stem). */
export function entrySlug(entry: { id: string }): string {
  const base = entry.id.replace(/\\/g, '/');
  const segment = base.split('/').pop() ?? base;
  return segment.replace(/\.md$/i, '');
}

function entryTimestamp(entry: DatedEntry): number {
  if (entry.data.publishedDate) return entry.data.publishedDate.getTime();
  if (entry.data.eventDate) return entry.data.eventDate.getTime();
  if (entry.data.performanceDate) return entry.data.performanceDate.getTime();
  if (entry.data.publishedYear) return Date.UTC(entry.data.publishedYear, 0, 1);
  return 0;
}

export function sortByPublishedDate<T extends DatedEntry>(items: T[]): T[] {
  return [...items].sort((a, b) => entryTimestamp(b) - entryTimestamp(a));
}

export function sortNovelsByYear<T extends { data: { publishedYear?: number } }>(
  items: T[],
): T[] {
  return [...items].sort(
    (a, b) => (b.data.publishedYear ?? 0) - (a.data.publishedYear ?? 0),
  );
}

export function countWords(text: string | undefined): number {
  if (!text?.trim()) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function cleanSummary(summary: string, title: string, fallback: string): string {
  const trimmed = summary?.trim() ?? '';
  if (
    !trimmed ||
    trimmed.length < 24 ||
    /^AD LIBITUN/i.test(trimmed) ||
    trimmed.startsWith('Descarga')
  ) {
    return fallback.replace('{title}', title);
  }
  return trimmed;
}

export const dateFormatter = new Intl.DateTimeFormat('es-ES', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

export const shortDateFormatter = new Intl.DateTimeFormat('es-ES', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});
