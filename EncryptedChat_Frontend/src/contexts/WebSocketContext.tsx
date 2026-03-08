import { createContext } from 'react';

// Adaptado al formato que envíe y reciba el backend cifrado.
export interface ChatMessage {
  id: string;
  type: string;
  apodo?: string;
  message?: string;
  timestamp?: string;
  isHistory?: boolean;
  [key: string]: unknown;
}

export interface WebSocketContextProps {
  messages: ChatMessage[];
  isConnected: boolean;
  activeGroupId: number | null;
  setActiveGroupId: (id: number | null) => void;
  sendMessage: (msg: string) => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export const WebSocketContext = createContext<WebSocketContextProps | undefined>(undefined);
