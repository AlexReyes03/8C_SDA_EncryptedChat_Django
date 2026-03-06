import { fetchWrapper } from './fetch-wrapper';

const CHAT_URL = '/chat';

export const chatServices = {
    // Ejemplo de llamadas que podrían ser necesarias si hay REST para chat, 
    // la mayoría de interactividad será por WebSockets pero es útil para historial:
    
    getChatHistory: async (roomId: string) => {
        return await fetchWrapper.get(`${CHAT_URL}/history/${roomId}/`);
    },
    
    // Configuración para la URL base del WebSocket
    getWebSocketURL: () => {
        const url = import.meta.env.VITE_WS_URL;
        if (!url) {
            console.error("VITE_WS_URL no está definido en el archivo .env");
        }
        return url;
    }
};
