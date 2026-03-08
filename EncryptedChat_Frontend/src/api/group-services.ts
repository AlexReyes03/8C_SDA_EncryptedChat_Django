import { fetchWrapper } from './fetch-wrapper';

const GROUPS_URL = '/groups';

interface CreateGroupPayload {
    name: string;
    max_participants: number;
    is_private: boolean;
    encrypted_symmetric_key?: string;
    raw_aes_key?: string;
}

export interface UpdateGroupPayload {
    name?: string;
    is_private?: boolean;
}

export const groupServices = {
    createGroup: async (data: CreateGroupPayload) => {
        return await fetchWrapper.post(`${GROUPS_URL}/`, data);
    },
    joinGroup: async (inviteCode: string) => {
        return await fetchWrapper.post(`${GROUPS_URL}/join/`, { invite_code: inviteCode });
    },
    updateGroup: async (groupId: number, data: UpdateGroupPayload) => {
        return await fetchWrapper.put(`${GROUPS_URL}/${groupId}/`, data);
    },
    getGroupInfo: async (groupId: number) => {
        // Asumiendo que pudiese haber un endpoint de detalle, o podríamos filtrarlo desde /me
        return await fetchWrapper.get(`${GROUPS_URL}/${groupId}/`);
    },
    getMyGroups: async () => {
        return await fetchWrapper.get(`${GROUPS_URL}/me/?t=${new Date().getTime()}`);
    },
    deleteGroup: async (groupId: number) => {
        return await fetchWrapper.delete(`${GROUPS_URL}/${groupId}/`);
    },
    leaveGroup: async (groupId: number) => {
        return await fetchWrapper.post(`${GROUPS_URL}/${groupId}/leave/`, {});
    },
    getGroupMembers: async (groupId: number) => {
        return await fetchWrapper.get(`${GROUPS_URL}/${groupId}/members/?t=${new Date().getTime()}`);
    },
    acceptGroupMember: async (groupId: number, userId: number, encryptedSymmetricKey: string) => {
        return await fetchWrapper.put(`${GROUPS_URL}/${groupId}/requests/`, { user_id: userId, accept: true, encrypted_symmetric_key: encryptedSymmetricKey });
    },
    rejectGroupMember: async (groupId: number, userId: number) => {
        return await fetchWrapper.put(`${GROUPS_URL}/${groupId}/requests/`, { user_id: userId, accept: false });
    },
    kickGroupMember: async (groupId: number, userId: number) => {
        return await fetchWrapper.post(`${GROUPS_URL}/${groupId}/kick/`, { user_id: userId });
    }
};
