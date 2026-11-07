const MICROS = 1_000_000;

export const buildIncomeKey = (adminId: string, year: number, month: number) =>
  `${adminId}:${year}-${month}`;

export const toMicros = (usdt: number | null | undefined): number =>
  Math.round((usdt ?? 0) * MICROS);

export const fromMicros = (micros: number): number => micros / MICROS;

// COM-04: unlinked Commissions grouped per Admin, in integer micros so cents never drift.
export const groupCommissionsByAdmin = (
  commissions: { id: string; adminId: string | null; commissionUsdt: number | null }[],
): Map<string, { ids: string[]; micros: number }> => {
  const groups = new Map<string, { ids: string[]; micros: number }>();

  for (const { id, adminId, commissionUsdt } of commissions) {
    if (!adminId) {
      continue;
    }

    const group = groups.get(adminId) ?? { ids: [], micros: 0 };

    group.ids.push(id);
    group.micros += toMicros(commissionUsdt);
    groups.set(adminId, group);
  }

  return groups;
};
