import { fetchWrapper } from './fetch-wrapper';

const SECURITY_URL = '/security';

export const securityServices = {
    uploadKeys: async (keyData: string, encryptedPrivateKey?: string) => {
        const payload: Record<string, string> = { key_data: keyData };
        if (encryptedPrivateKey) {
            payload.encrypted_private_key = encryptedPrivateKey;
        }
        return await fetchWrapper.post(`${SECURITY_URL}/keys/`, payload);
    },

    getMyKeys: async () => {
        return await fetchWrapper.get(`${SECURITY_URL}/keys/?t=${new Date().getTime()}`);
    },

    getPublicKey: async (userId: number) => {
        return await fetchWrapper.get(`${SECURITY_URL}/keys/${userId}/?t=${new Date().getTime()}`);
    }
};
