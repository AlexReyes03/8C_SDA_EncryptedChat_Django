import React, { createContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { chatServices } from '../api/chat-services';

// Adaptado al formato que envíe y reciba el backend cifrado.
export interface ChatMessage {
  id: string;
  type: string;
  apodo?: string;
  message?: string;
  timestamp?: string;
  [key: string]: unknown;
}

interface WebSocketContextProps {
  messages: ChatMessage[];
  isConnected: boolean;
  sendMessage: (msg: string) => void;
}

export const WebSocketContext = createContext<WebSocketContextProps | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    // Al montar el Provider, intentamos conectar asumiendo que el usuario está logeado.
    const token = localStorage.getItem('access_token');
    
    // Si no hay token, no intentamos conectar (útil para no estallar en layouts envueltos)
    if (!token) return;

    // Se asume que el backend acepta el token vía querystring o protocolo secundario:
    // P.ej. ws://localhost:8000/ws/chat/?token=abc
    const wsUrl = `${chatServices.getWebSocketURL()}/chat/?token=${token}`;
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log('WebSocket Conectado exitosamente');
      setIsConnected(true);
      setMessages((prev) => [
        ...prev, 
        { id: Date.now().toString(), type: 'system', message: 'Conectado al servidor de mensajería cifrada' }
      ]);
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WS Mensaje recibido:', data);

        // Si es un evento de bienvenida con historial:
        if (data.type === 'welcome' && data.history) {
          setMessages(data.history);
        } else {
          // Asegurarnos de que el mensaje entrante tenga un ID único para React (si no lo trae)
          const appendMsg = { ...data, id: data.id || Date.now().toString() };
          setMessages((prev) => [...prev, appendMsg]);
        }
      } catch (e) {
        console.error("Error parseando mensaje WS:", e);
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket Error:', error);
      setIsConnected(false);
    };

    websocket.onclose = () => {
      console.log('WebSocket Desconectado');
      setIsConnected(false);
      setMessages((prev) => [
        ...prev, 
        { id: Date.now().toString(), type: 'system', message: 'Desconectado del servidor' }
      ]);
    };

    // Almacenamos asincrónicamente para que no desencadene cascada en el montaje de dependencias
    Promise.resolve().then(() => {
        setWs(websocket);
    });
    
    // Cleanup al desmontar el Provider (Usuario hace logout o cierra la pestaña)
    return () => {
      websocket.close();
    };
  }, []);

  const sendMessage = useCallback((messageContent: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'chat',
        message: messageContent
      }));
    } else {
      console.warn("Intento de envío fallido: WebSocket no está conectado.");
    }
  }, [ws]);

  return (
    <WebSocketContext.Provider value={{ messages, isConnected, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
};
