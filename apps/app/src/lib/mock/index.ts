// Mockging removed: exports are now empty placeholders to encourage use of
// the real API client (`@/lib/api`). Importing these will return empty
// collections during the transition.

export const chartData: unknown[] = [];
export const dashboardStats: Record<string, unknown> = {};
export const activityFeed: unknown[] = [];

export default { chartData, dashboardStats, activityFeed };
