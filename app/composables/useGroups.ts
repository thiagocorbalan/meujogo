export function useGroups() {
  const { fetch } = useApi();
  return {
    getGroups: () => fetch('/groups'),
    createGroup: (data: any) => fetch('/groups', { method: 'POST', body: data }),
    getInviteInfo: (code: string) => fetch(`/groups/invite/${code}`),
    joinGroup: (code: string, linkPlayerId?: number) =>
      fetch(`/groups/invite/${code}/join`, {
        method: 'POST',
        body: linkPlayerId ? { linkPlayerId } : {},
      }),
    getMembers: (groupId: string | number) => fetch(`/groups/${groupId}/members`),
    addGuestPlayer: (groupId: string | number, data: any) =>
      fetch(`/groups/${groupId}/guest-player`, { method: 'POST', body: data }),
    regenerateInviteCode: (groupId: string | number) =>
      fetch(`/groups/${groupId}/invite/regenerate`, { method: 'POST' }),
    removeMember: (groupId: string | number, memberId: string | number) =>
      fetch(`/groups/${groupId}/members/${memberId}`, { method: 'DELETE' }),
    updateMemberRole: (groupId: string | number, memberId: string | number, role: string) =>
      fetch(`/groups/${groupId}/members/${memberId}`, { method: 'PATCH', body: { role } }),
    getGroup: (groupId: string | number) => fetch(`/groups/${groupId}`),
    updateGroup: (groupId: string | number, data: any) =>
      fetch(`/groups/${groupId}`, { method: 'PATCH', body: data }),
    suspendMember: (groupId: string | number, memberId: string | number) =>
      fetch(`/groups/${groupId}/members/${memberId}/suspend`, { method: 'PATCH' }),
    reactivateMember: (groupId: string | number, memberId: string | number) =>
      fetch(`/groups/${groupId}/members/${memberId}/reactivate`, { method: 'PATCH' }),
  };
}
