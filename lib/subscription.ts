export const PLAN_LIMITS = {
  free:   { leadsPerMonth: 5 },
  growth: { leadsPerMonth: 30 },
  pro:    { leadsPerMonth: Infinity },
} as const;

export type SubscriptionPlan = keyof typeof PLAN_LIMITS;

export function getLeadLimit(plan: SubscriptionPlan): number {
  return PLAN_LIMITS[plan]?.leadsPerMonth ?? PLAN_LIMITS.free.leadsPerMonth;
}

/** Returns true if the vendor's monthly reset window has passed (>30 days since last reset). */
export function shouldResetCount(leadCountResetAt?: Date | string | null): boolean {
  if (!leadCountResetAt) return true;
  const resetDate = new Date(leadCountResetAt);
  const now = new Date();
  const diffMs = now.getTime() - resetDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= 30;
}
