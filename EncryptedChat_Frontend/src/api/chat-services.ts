import { fetchWrapper } from './fetch-wrapper';

const CHAT_URL = '/chat';

export const chatServices = {
    // la mayoría de interactividad será por WebSockets pero es útil para historial:
    
    getChatHistory: async (roomId: string) => {
        return await fetchWrapper.get(`${CHAT_URL}/history/${roomId}/`);
    },
    
    // Configuración para la URL base del WebSocket
    getWebSocketURL: () => {
        let url = import.meta.env.VITE_WS_URL || '';
        
        if (!url) {
            console.error("VITE_WS_URL no está definido en el archivo .env");
            return '';
        }

        // Auto-corregir protocolos mal formados por variables de entorno
        url = url.replace(/^(ws:https:\/\/|wss:https:\/\/|https:\/\/)/, 'wss://');
        url = url.replace(/^(http:\/\/|ws:http:\/\/)/, 'ws://');

        // Forzar WSS (Seguridad) si la página actual está HTTPS para prevenir Mixed Content
        if (window.location.protocol === 'https:' && url.startsWith('ws://')) {
            url = url.replace('ws://', 'wss://');
        }

        return url;
    }
};
