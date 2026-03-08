import React, { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { chatServices } from '../api/chat-services';
import { groupServices } from '../api/group-services';
import { CHAT_CRYPTO } from '../utils/crypto';
import ConfirmActionModal from '../features/chat/components/ConfirmActionModal';
import { WebSocketContext } from './WebSocketContext';
import type { ChatMessage } from './WebSocketContext';

export const WebSocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [errorModal, setErrorModal] = useState<{ show: boolean, message: string }>({ show: false, message: '' });

  // Referencia a la llave AES actual para usarla dentro del closure de onmessage
  const activeAESKeyRef = React.useRef<string | null>(null);

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
      setIsConnected(true);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), type: 'system', message: 'Conectado al servidor de mensajería cifrada' }
      ]);
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const currentAES = activeAESKeyRef.current;

        // Si es un evento de bienvenida con historial (desde get_group_history)
        if (data.type === 'group_history' && data.messages) {
          const mappedHistory = data.messages.map((m: { message_id?: string, sender_username?: string, encrypted_content: string, [key: string]: unknown }) => {
            const decrypted = currentAES ? CHAT_CRYPTO.decryptAES(currentAES, m.encrypted_content) : m.encrypted_content;
            return {
              ...m,
              id: m.message_id || Date.now().toString(),
              apodo: m.sender_username || 'Sistema',
              message: decrypted || '*(Mensaje no descifrable)*',
              isHistory: true
            };
          });
          setMessages(mappedHistory);
        } else if (data.type === 'incoming_message') {
          // Asegurarnos de ignorar si el mensaje es de una sala diferente
          setMessages((prev) => {
            const currentAES = activeAESKeyRef.current;
            const decrypted = currentAES ? CHAT_CRYPTO.decryptAES(currentAES, data.encrypted_content) : data.encrypted_content;
            const appendMsg = {
              ...data,
              id: data.message_id || Date.now().toString(),
              apodo: data.sender_username || 'Sistema',
              message: decrypted || '*(Mensaje no descifrable)*'
            };
            return [...prev, appendMsg];
          });
        } else {
          // System o ack messages
          const appendMsg = { ...data, id: data.id || data.message_id || Date.now().toString() };
          setMessages((prev) => [...prev, appendMsg]);
        }
      } catch {
        // Fallo de parseo omitido
      }
    };

    websocket.onerror = () => {
      setIsConnected(false);
    };

    websocket.onclose = () => {
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
    const fetchKeysAndJoin = async () => {
      if (!activeGroupId) {
        activeAESKeyRef.current = null;
        return;
      }

      try {
        // Descargar mi encrypted_symmetric_key temporalmente
        const users = await groupServices.getGroupMembers(activeGroupId);
        const myUsername = localStorage.getItem('username');
        const me = users.find((u: { username: string, encrypted_symmetric_key?: string }) => u.username === myUsername);

        if (me && me.encrypted_symmetric_key) {
          const privKey = CHAT_CRYPTO.getMyPrivateKey(myUsername!);
          if (privKey) {
            const aes = CHAT_CRYPTO.decryptRSA(privKey, me.encrypted_symmetric_key);
            if (aes) {
              activeAESKeyRef.current = aes;
            } else {
              console.error("Fallo Criptográfico: No se pudo descifrar la llave. AES_KEY length:", me.encrypted_symmetric_key.length);
              setErrorModal({ show: true, message: "No se pudo descifrar el cifrado del grupo. Por favor cierra sesión y vuelve a ingresar para resincronizar tus llaves." });
            }
          } else {
            console.error("Error: No se encontró la Llave Privada en el almacenamiento local.");
          }
        } else {
            console.error("Error crítico E2EE: La llave del grupo no llegó del Servidor.");
        }

        // Una vez puesta la llave, solicitamos el historial por socket
        if (ws && ws.readyState === WebSocket.OPEN) {
          setMessages([]); // Limpiar mensajes
          ws.send(JSON.stringify({
            action: "get_group_history",
            group_id: activeGroupId
          }));
        }
      } catch {
        // Fallo carga llaves ignorado silenciosamente
      }
    };

    fetchKeysAndJoin();
  }, [activeGroupId, ws]);

  const sendMessage = useCallback((messageContent: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      if (!activeGroupId) return;

      if (!activeAESKeyRef.current) {
        setErrorModal({ show: true, message: "Error E2EE: Grupo incompatible o error descifrando tu llave. Por favor, crea un grupo nuevo para asegurar la comunicación cifrada." });
        return;
      }

      const finalContent = CHAT_CRYPTO.encryptAES(activeAESKeyRef.current, messageContent);

      ws.send(JSON.stringify({
        action: 'send_message',
        recipient_id: null,
        group_id: activeGroupId,
        encrypted_content: finalContent
      }));
    }
  }, [ws, activeGroupId]);

  return (
    <WebSocketContext.Provider value={{ messages, isConnected, activeGroupId, setActiveGroupId, sendMessage, setMessages }}>
      {children}
      <ConfirmActionModal
        show={errorModal.show}
        onClose={() => setErrorModal({ show: false, message: '' })}
        onConfirm={() => setErrorModal({ show: false, message: '' })}
        title="Validación de Seguridad"
        message={errorModal.message}
        confirmText="Aceptar"
        isLoading={false}
      />
    </WebSocketContext.Provider>
  );
};
