import { useState, useEffect, useCallback } from 'react';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import GroupIcon from '@mui/icons-material/Group';
import StarIcon from '@mui/icons-material/Star';
import LockIcon from '@mui/icons-material/Lock';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CreateGroupModal from '../../features/chat/components/CreateGroupModal';
import JoinGroupModal from '../../features/chat/components/JoinGroupModal';
import GroupSettingsModal from '../../features/chat/components/GroupSettingsModal';
import { groupServices } from '../../api/group-services';
import { useWebSocket } from '../../hooks/useWebSocket';

// Definición aproximada del modelo de Django
export interface GroupData {
  id: number;
  name: string;
  room_id: number;
  membership?: {
    role: 'admin' | 'member';
    status: 'pending' | 'accepted';
  };
  members_count?: number;
  is_private?: boolean;
}

export default function Sidebar() {
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  // Settings Modal State
  const [selectedGroupForSettings, setSelectedGroupForSettings] = useState<GroupData | null>(null);

  const [groups, setGroups] = useState<GroupData[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);

  const { activeGroupId, setActiveGroupId, setMessages } = useWebSocket();

  const loadGroups = useCallback(async () => {
    try {
      setIsLoadingGroups(true);
      const data = await groupServices.getMyGroups();
      setGroups(data);
    } catch (error) {
      console.error("Error cargando grupos:", error);
    } finally {
      setIsLoadingGroups(false);
    }
  }, []);

  // Cargar grupos iniciales al montar
  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  // Si cerramos modal, recargar (Refrescamos lista de grupos si se creo o se unió exitosamente)
  const handleModalClose = async () => {
    setShowCreate(false);
    setShowJoin(false);
    setSelectedGroupForSettings(null);

    try {
      // Recargar grupos y auto-seleccionar el último si es un modal de creación (esto asume que el backend los ordena, 
      // o buscamos el último ID. Por simplicidad solo refrescamos la lista).
      // Lo ideal aquí sería que el Modal devolviera el `newGroupId` y hacer set.
      const data = await groupServices.getMyGroups();
      setGroups(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleGroupClick = (id: number) => {
    if (activeGroupId === id) {
      setActiveGroupId(null);
      setMessages([]);
    } else {
      setMessages([]); // Limpiar mensajes mientras carga el historial nuevo
      setActiveGroupId(id);
    }
  };

  return (
    <>
      <div className="h-100 w-100 p-3 bg-sidebar border-end border-custom d-flex flex-column">

        <div className="d-flex justify-content-between align-items-center mb-4">
          <h6 className="text-white mb-0 fw-bold">Grupos</h6>
        </div>

        {/* Acciones de Grupo */}
        <div className="d-flex flex-column flex-xl-row gap-2 mb-4">
          <button
            className="btn btn-sm text-white w-100 d-flex align-items-center justify-content-center border-custom"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', transition: 'background-color 0.2s' }}
            onClick={() => setShowJoin(true)}
          >
            <GroupIcon fontSize="small" className="me-2 text-brand-secondary" />
            Unirse
          </button>

          <button
            className="btn btn-sm text-white w-100 d-flex align-items-center justify-content-center"
            style={{ backgroundColor: 'var(--brand-primary)', transition: 'opacity 0.2s' }}
            onClick={() => setShowCreate(true)}
          >
            <AddCircleOutlineIcon fontSize="small" className="me-2" />
            Crear
          </button>
        </div>

        {/* Lista Dinámica de Grupos */}
        <div className="flex-grow-1 overflow-auto pe-2" style={{ cssText: "::-webkit-scrollbar { width: '4px' }" } as React.CSSProperties}>

          {isLoadingGroups ? (
            <div className="text-center text-muted-custom mt-4 small">
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Cargando tus grupos...
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center text-muted-custom mt-4 small">
              No estás en ningún grupo aún.
            </div>
          ) : (
            groups.map((group) => {
              const isAdmin = group.membership?.role === 'admin';
              return (
                <div
                  key={group.id}
                  onClick={() => handleGroupClick(group.id)}
                  data-bs-dismiss="offcanvas"
                  className="d-flex align-items-center mb-2 p-2 rounded position-relative"
                  style={{
                    backgroundColor: activeGroupId === group.id ? '#7C148C' : 'rgba(255,255,255,0.05)',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    boxShadow: activeGroupId === group.id ? '0 0 10px rgba(124, 20, 140, 0.5)' : 'none'
                  }}
                  onMouseEnter={(e) => { if (activeGroupId !== group.id) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)' }}
                  onMouseLeave={(e) => { if (activeGroupId !== group.id) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)' }}
                >
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                    style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: 'var(--brand-secondary)',
                      color: '#fff',
                      fontWeight: 'bold',
                      fontSize: '1.2rem'
                    }}
                  >
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="d-flex w-100 justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <h6 className="mb-0 text-white fw-medium text-truncate" style={{ maxWidth: '120px' }}>
                        {group.name}
                      </h6>
                      {isAdmin && (
                        <StarIcon fontSize="small" className="ms-2 text-white" titleAccess="Administrador" />
                      )}
                      {group.is_private && (
                        <LockIcon fontSize="small" className="ms-1 text-white-50" titleAccess="Grupo Privado" />
                      )}
                    </div>

                    <div className="d-flex align-items-center">
                      <button
                        className="btn btn-sm text-secondary p-1"
                        onClick={(e) => { e.stopPropagation(); setSelectedGroupForSettings(group); }}
                        title={isAdmin ? "Configuración de Grupo" : "Detalles del Grupo"}
                      >
                        <MoreVertIcon fontSize="small" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Botón flotante o acción inferior para el Sidebar */}
        <div className="mt-auto pt-3 border-top border-custom">
          <div className="d-flex align-items-center text-white-50 small mt-2">
            <i className="bi bi-circle-fill me-2" style={{ fontSize: '8px', color: '#28a745' }}></i>
            Mensajes cifrados de Extremo a Extremo
          </div>
        </div>
      </div>

      <CreateGroupModal show={showCreate} onClose={handleModalClose} />
      <JoinGroupModal show={showJoin} onClose={handleModalClose} />
      <GroupSettingsModal
        show={selectedGroupForSettings !== null}
        onClose={handleModalClose}
        group={selectedGroupForSettings}
      />
    </>
  );
}
