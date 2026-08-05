/**
 * UR-TODO-046-C3C-B: pure toggle-set logic for the "mark as reasonable" session
 * badge on derived evidence rows. Deliberately has no dependency on React state,
 * storage, or network — it only ever transforms an in-memory id set. Component
 * state built from this is never read from or written to localStorage/Firebase/
 * JSON Backup, so a fresh render (e.g. after a page reload) always starts empty.
 */
export function toggleRuntimeAttributionMark(current: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(current);
  if (next.has(id)) next.delete(id); else next.add(id);
  return next;
}
