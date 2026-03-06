import { fetchWrapper } from './fetch-wrapper';

const GROUPS_URL = '/groups';

interface CreateGroupPayload {
    name: string;
    max_participants: number;
    is_private: boolean;
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
        return await fetchWrapper.get(`${GROUPS_URL}/me/`);
    }
};
