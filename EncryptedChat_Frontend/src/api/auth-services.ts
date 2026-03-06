import { fetchWrapper } from './fetch-wrapper';

const AUTH_URL = '/users';

export const authServices = {
    login: async (username: string, password: string) => {
        const response = await fetchWrapper.post(`${AUTH_URL}/login/`, { username, password });
        return response; // Espera access y refresh
    },
    
    register: async (data: Record<string, unknown>) => {
        return await fetchWrapper.post(`${AUTH_URL}/register/`, data);
    },

    refreshToken: async (refresh: string) => {
        return await fetchWrapper.post(`${AUTH_URL}/token/refresh/`, { refresh });
    },

    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('access_token');
    }
};
