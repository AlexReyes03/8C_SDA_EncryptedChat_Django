import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SendIcon from '@mui/icons-material/Send';
import AddIcon from '@mui/icons-material/Add';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import GroupIcon from '@mui/icons-material/Group';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { groupServices } from '../../../api/group-services';
import type { GroupData } from '../../../components/layout/Sidebar';

export default function Chat() {
  const [inputMessage, setInputMessage] = useState('');
  const [activeGroupInfo, setActiveGroupInfo] = useState<GroupData | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, isConnected, activeGroupId, sendMessage } = useWebSocket();

  // Se extrae el username desde local storage para identificar si es el current user 
  // O en un esquema avanzado, decodificando el access_token JWT.
  const currentUser = {
    apodo: localStorage.getItem('username') || 'Tú'
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Obtener info del grupo activo para el Navbar interno
  useEffect(() => {
    const fetchGroupInfo = async () => {
      if (activeGroupId) {
        try {
          const data = await groupServices.getGroupInfo(activeGroupId);
          setActiveGroupInfo(data);
        } catch (e) {
          console.error("No se pudo obtener info del grupo", e);
        }
      } else {
        setActiveGroupInfo(null);
      }
    };
    fetchGroupInfo();
  }, [activeGroupId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputMessage.trim() || !isConnected) return;

    sendMessage(inputMessage);
    setInputMessage('');
  };

  if (!activeGroupId) {
    return (
      <div className="d-flex flex-column h-100 bg-main pt-2 justify-content-center align-items-center text-center">
        <div className="text-muted-custom">
          <h5 className="mb-2 fw-bold text-white-50">Selecciona un grupo</h5>
          <p className="small">Haz clic en un grupo de la barra lateral para ver su historial o comenzar a chatear.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column h-100 bg-main position-relative">
      {/* Inner Navbar (Active Group Info) */}
      <div className="bg-sidebar border-bottom border-custom px-4 py-3 d-flex align-items-center justify-content-between shadow-sm z-2">
        <div className="d-flex align-items-center">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0"
            style={{
              width: '45px',
              height: '45px',
              backgroundColor: 'var(--brand-secondary)',
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: '1.4rem',
            }}
          >
            {activeGroupInfo ? activeGroupInfo.name.charAt(0).toUpperCase() : '?'}
          </div>
          <div>
            <h5 className="mb-0 text-white fw-bold">{activeGroupInfo ? activeGroupInfo.name : 'Cargando...'}</h5>
            <small className="text-white-50 d-flex align-items-center">
              <GroupIcon fontSize="inherit" className="me-1" />
              {activeGroupInfo?.membership?.status === 'accepted' ? 'Miembro activo' : 'Cargando estado...'}
            </small>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-grow-1 overflow-auto p-3 p-md-4 pt-4">
        <AnimatePresence>
          {messages.map((msg: { id: string; type: string; apodo?: string; message?: string; timestamp?: string; }) => {
            const isCurrentUser = msg.apodo === currentUser.apodo;

            if (msg.type === 'system') {
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center mb-3"
                >
                  <small className="text-brand-primary fw-medium bg-sidebar px-3 py-1 rounded-pill">{msg.message}</small>
                </motion.div>
              );
            }

            if (msg.type === 'user_joined' || msg.type === 'user_left') {
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center mb-3 text-muted-custom small"
                >
                  {msg.type === 'user_joined' ? <LoginIcon fontSize="inherit" className="me-1" /> : <LogoutIcon fontSize="inherit" className="me-1" />}
                  {msg.apodo} {msg.type === 'user_joined' ? 'se unió al chat' : 'salió del chat'}
                </motion.div>
              );
            }

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className={`d-flex mb-3 ${isCurrentUser ? 'justify-content-end' : 'justify-content-start'}`}
              >
                {!isCurrentUser && (
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0 text-white fw-bold shadow-sm"
                    style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: 'var(--brand-secondary)',
                    }}
                  >
                    {(msg.apodo || '?')[0].toUpperCase()}
                  </div>
                )}

                <div
                  className={`p-3 rounded-4 shadow-sm ${isCurrentUser ? 'text-white' : 'text-primary'}`}
                  style={{
                    maxWidth: '75%',
                    backgroundColor: isCurrentUser ? 'var(--brand-primary)' : 'var(--bg-sidebar)',
                    borderBottomRightRadius: isCurrentUser ? '4px' : '1rem',
                    borderBottomLeftRadius: !isCurrentUser ? '4px' : '1rem',
                  }}
                >
                  <div className="d-flex align-items-baseline mb-1">
                    {!isCurrentUser && (
                      <span className="fw-bold me-2" style={{ color: 'var(--brand-secondary)' }}>
                        {msg.apodo}
                      </span>
                    )}
                    <small className="ms-auto" style={{ color: isCurrentUser ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>
                      {msg.timestamp && !isNaN(Date.parse(msg.timestamp))
                        ? new Date(msg.timestamp).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                        : ''}
                    </small>
                  </div>
                  <div className="text-break" style={{ color: isCurrentUser ? '#fff' : 'var(--text-primary)' }}>
                    {msg.message}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-sidebar border-top border-custom mt-auto z-3">
        <form onSubmit={handleSendMessage}>
          <div className="input-group align-items-center rounded-3 overflow-hidden bg-navbar border border-custom p-1">
            <input
              type="text"
              className="form-control bg-transparent border-0 text-white shadow-none"
              placeholder={isConnected ? "Escribe un mensaje..." : "Conectando..."}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              autoComplete="off"
              disabled={!isConnected}
              style={{ paddingLeft: '10px' }}
            />
            <motion.button
              whileHover={{ scale: isConnected && inputMessage.trim() ? 1.05 : 1 }}
              whileTap={{ scale: isConnected && inputMessage.trim() ? 0.95 : 1 }}
              type="submit"
              className="btn rounded-circle text-white m-1"
              disabled={!isConnected || !inputMessage.trim()}
              style={{
                backgroundColor: isConnected && inputMessage.trim() ? 'var(--brand-primary)' : '#555',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isConnected && inputMessage.trim() ? 1 : 0.6
              }}
            >
              <SendIcon fontSize="small" style={{ marginLeft: '4px' }} />
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
}
