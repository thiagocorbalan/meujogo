export function useUsers() {
  const { fetch } = useApi();
  return {
    getUsers: () => fetch('/users'),
    createUser: (data: any) => fetch('/users', { method: 'POST', body: data }),
    updateUser: (id: string | number, data: any) => fetch(`/users/${id}`, { method: 'PATCH', body: data }),
    deleteUser: (id: string | number) => fetch(`/users/${id}`, { method: 'DELETE' }),
  };
}
