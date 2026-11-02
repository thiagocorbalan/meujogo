export function useAdminApi() {
  const { fetch: apiFetch, baseURL } = useApi()

  // Generic helpers that prefix all paths with /admin
  async function get<T = any>(path: string): Promise<T> {
    return apiFetch<T>(`/admin${path}`)
  }

  async function post<T = any>(path: string, body?: Record<string, any>): Promise<T> {
    return apiFetch<T>(`/admin${path}`, { method: 'POST', body })
  }

  async function patch<T = any>(path: string, body?: Record<string, any>): Promise<T> {
    return apiFetch<T>(`/admin${path}`, { method: 'PATCH', body })
  }

  async function del<T = any>(path: string): Promise<T> {
    return apiFetch<T>(`/admin${path}`, { method: 'DELETE' })
  }

  // ── Stats ────────────────────────────────────────────────────────────────

  function getStats(period?: string) {
    const query = period ? `?period=${encodeURIComponent(period)}` : ''
    return get<any>(`/stats${query}`)
  }

  function getStripeStats() {
    return get<any>('/stats/stripe')
  }

  // ── Users ────────────────────────────────────────────────────────────────

  function getUsers(params?: Record<string, string | number>) {
    const query = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    return get<any>(`/users${query}`)
  }

  function getUser(id: string | number) {
    return get<any>(`/users/${id}`)
  }

  function suspendUser(id: string | number, reason: string) {
    return post<any>(`/users/${id}/suspend`, { reason })
  }

  function unsuspendUser(id: string | number) {
    return post<any>(`/users/${id}/unsuspend`)
  }

  function impersonateUser(id: string | number) {
    return post<{ token: string }>(`/users/${id}/impersonate`)
  }

  // ── Groups ───────────────────────────────────────────────────────────────

  function getGroups(params?: Record<string, string | number>) {
    const query = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    return get<any>(`/groups${query}`)
  }

  function getGroup(id: string | number) {
    return get<any>(`/groups/${id}`)
  }

  function suspendGroup(id: string | number, reason: string) {
    return post<any>(`/groups/${id}/suspend`, { reason })
  }

  function reactivateGroup(id: string | number) {
    return post<any>(`/groups/${id}/reactivate`)
  }

  // ── Audit log ────────────────────────────────────────────────────────────

  function getAuditLog(params?: Record<string, string | number>) {
    const query = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    return get<any>(`/audit${query}`)
  }

  // ── Plans ────────────────────────────────────────────────────────────────

  function getPlans() {
    return get<any>('/plans')
  }

  // ── Billing ──────────────────────────────────────────────────────────────

  function getBillingOverview() {
    return get<any>('/billing/overview')
  }

  function createPlan(data: Record<string, any>) {
    return post<any>('/plans', data)
  }

  function updatePlan(id: string | number, data: Record<string, any>) {
    return patch<any>(`/plans/${id}`, data)
  }

  function deletePlan(id: string | number) {
    return del<any>(`/plans/${id}`)
  }

  // ── Legal ────────────────────────────────────────────────────────────────

  function getLegalHistory(type: string) {
    return get<any>(`/legal/${type}/history`)
  }

  function createLegalDoc(type: string, data: Record<string, any>) {
    return post<any>(`/legal/${type}`, data)
  }

  function updateLegalDoc(type: string, id: string | number, data: Record<string, any>) {
    return patch<any>(`/legal/${type}/${id}`, data)
  }

  function publishLegalDoc(type: string, id: string | number) {
    return post<any>(`/legal/${type}/${id}/publish`)
  }

  // ── Integrations ─────────────────────────────────────────────────────────

  function getIntegrations() {
    return get<any>('/integrations')
  }

  function upsertIntegration(service: string, key: string) {
    return apiFetch<any>(`/admin/integrations/${service}`, { method: 'PUT', body: { key } })
  }

  function testIntegration(service: string) {
    return post<any>(`/integrations/${service}/test`)
  }

  return {
    baseURL,
    // Generic
    get,
    post,
    patch,
    del,
    // Stats
    getStats,
    getStripeStats,
    // Users
    getUsers,
    getUser,
    suspendUser,
    unsuspendUser,
    impersonateUser,
    // Groups
    getGroups,
    getGroup,
    suspendGroup,
    reactivateGroup,
    // Audit
    getAuditLog,
    // Plans
    getPlans,
    createPlan,
    updatePlan,
    deletePlan,
    // Billing
    getBillingOverview,
    // Legal
    getLegalHistory,
    createLegalDoc,
    updateLegalDoc,
    publishLegalDoc,
    // Integrations
    getIntegrations,
    upsertIntegration,
    testIntegration,
  }
}
