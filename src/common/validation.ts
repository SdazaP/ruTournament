export const isDuplicateName = (name: string, existingNames: string[], excludeIndex?: number): boolean => {
  const normalized = name.toLowerCase().trim();
  if (!normalized) return false;
  return existingNames.some((n, i) =>
    i !== excludeIndex && n.toLowerCase().trim() === normalized
  );
};

export const findDuplicateNames = (names: string[]): string[] => {
  const normalized = names.map((n) => n.toLowerCase().trim()).filter(Boolean);
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const n of normalized) {
    if (seen.has(n)) duplicates.add(n);
    seen.add(n);
  }
  return [...duplicates];
};
