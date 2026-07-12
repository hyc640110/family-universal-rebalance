export type FamilyRelationship = 'spouse' | 'child' | 'parent' | 'other';
export type FamilyMember = { id: string; name: string; relationship: FamilyRelationship; birthYear?: number; includeInStatistics: boolean };
export type OwnerType = 'personal' | 'spouse' | 'shared';
export type AssetOwnership = { ownerType: OwnerType; memberId?: string };
export type DashboardScope = 'personal' | 'family' | 'all';
export const relationshipLabels: Record<FamilyRelationship, string> = { spouse: '配偶', child: '子女', parent: '父母', other: '其他' };
export const ownerLabels: Record<OwnerType, string> = { personal: '個人', spouse: '配偶', shared: '家庭共同' };
const year = new Date().getFullYear();
const id = (value: unknown, index: number) => typeof value === 'object' && value && typeof (value as { id?: unknown }).id === 'string' && (value as { id: string }).id ? (value as { id: string }).id : `family-${index}`;

export function normalizeFamilyMembers(raw: unknown): FamilyMember[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((value, index) => {
    const member = value && typeof value === 'object' ? value as Partial<FamilyMember> : {};
    const relationship: FamilyRelationship = member.relationship === 'spouse' || member.relationship === 'child' || member.relationship === 'parent' ? member.relationship : 'other';
    const birthYear = Number(member.birthYear);
    return { id: id(value, index), name: String(member.name ?? '').trim(), relationship, birthYear: Number.isInteger(birthYear) && birthYear >= 1900 && birthYear <= year ? birthYear : undefined, includeInStatistics: member.includeInStatistics !== false };
  }).filter(member => member.name);
}
export function normalizeAssetOwnership(raw: unknown, members: FamilyMember[]): Record<string, AssetOwnership> {
  if (!raw || typeof raw !== 'object') return {};
  const validIds = new Set(members.map(member => member.id));
  const normalized: Record<string, AssetOwnership> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const ownership = value && typeof value === 'object' ? value as Partial<AssetOwnership> : {};
    if (ownership.ownerType === 'spouse' && ownership.memberId && validIds.has(ownership.memberId)) normalized[key] = { ownerType: 'spouse', memberId: ownership.memberId };
    else if (ownership.ownerType === 'shared') normalized[key] = { ownerType: 'shared' };
    else normalized[key] = { ownerType: 'personal' };
  }
  return normalized;
}
export function ownershipFor(key: string, ownership: Record<string, AssetOwnership>): AssetOwnership { return ownership[key] ?? { ownerType: 'personal' }; }
export function assetInScope(key: string, ownership: Record<string, AssetOwnership>, members: FamilyMember[], scope: DashboardScope): boolean {
  if (scope === 'all') return true;
  const item = ownershipFor(key, ownership);
  if (scope === 'personal') return item.ownerType === 'personal';
  return item.ownerType === 'shared' || (item.ownerType === 'spouse' && Boolean(item.memberId && members.some(member => member.id === item.memberId && member.includeInStatistics)));
}
export function pruneAssetOwnership(ownership: Record<string, AssetOwnership>, members: FamilyMember[]): Record<string, AssetOwnership> { return normalizeAssetOwnership(ownership, members); }
