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
  activeGroupId: number | null;
  setActiveGroupId: (id: number | null) => void;
  sendMessage: (msg: string) => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export const WebSocketContext = createContext<WebSocketContextProps | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
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

        // Si es un evento de bienvenida con historial (desde get_group_history)
        if (data.type === 'group_history' && data.messages) {
          const mappedHistory = data.messages.map((m: any) => ({
             ...m,
             id: m.message_id || Date.now().toString(),
             apodo: m.sender_username || 'Sistema',
             message: m.encrypted_content || ''
          }));
          setMessages(mappedHistory);
        } else if (data.type === 'incoming_message') {
           // Asegurarnos de ignorar si el mensaje es de una sala diferente
           setMessages((prev) => {
             const appendMsg = { 
               ...data, 
               id: data.message_id || Date.now().toString(),
               apodo: data.sender_username || 'Sistema',
               message: data.encrypted_content || ''
             };
             return [...prev, appendMsg];
           });
        } else {
          // System o ack messages
          const appendMsg = { ...data, id: data.id || data.message_id || Date.now().toString() };
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

  // Escuchar si el grupo activo cambia para borrar el chat y pedir el nuevo historial
  useEffect(() => {
    if (ws && ws.readyState === WebSocket.OPEN && activeGroupId) {
       console.log("Solicitando historial para grupo:", activeGroupId);
       ws.send(JSON.stringify({
          action: "get_group_history",
          group_id: activeGroupId
       }));
    }
  }, [activeGroupId, ws]);

  const sendMessage = useCallback((messageContent: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      if (!activeGroupId) {
         console.warn("No hay un grupo activo al cual enviar el mensaje");
         return;
      }
      ws.send(JSON.stringify({
        action: 'send_message',
        recipient_id: null,
        group_id: activeGroupId, 
        encrypted_content: messageContent
      }));
    } else {
      console.warn("Intento de envío fallido: WebSocket no está conectado.");
    }
  }, [ws, activeGroupId]);

  return (
    <WebSocketContext.Provider value={{ messages, isConnected, activeGroupId, setActiveGroupId, sendMessage, setMessages }}>
      {children}
    </WebSocketContext.Provider>
  );
};
