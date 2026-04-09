export function useAuth() {
  const { fetch } = useApi()

  return {
    login: (data: { email: string; password: string; rememberMe?: boolean }) =>
      fetch('/auth/login', { method: 'POST', body: data }),
    register: (data: { name: string; email: string; password: string }) =>
      fetch('/auth/register', { method: 'POST', body: data }),
    refresh: () =>
      fetch('/auth/refresh', { method: 'POST' }),
    logout: () => fetch('/auth/logout', { method: 'POST' }),
    forgotPassword: (email: string) =>
      fetch('/auth/forgot-password', { method: 'POST', body: { email } }),
    resetPassword: (data: { token: string; password: string }) =>
      fetch('/auth/reset-password', { method: 'POST', body: data }),
    getMe: () => fetch('/auth/me'),
  }
}
