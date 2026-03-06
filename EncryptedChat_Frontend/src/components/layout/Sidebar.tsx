import { useState, useEffect, useCallback } from 'react';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import GroupIcon from '@mui/icons-material/Group';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CreateGroupModal from '../../features/chat/components/CreateGroupModal';
import JoinGroupModal from '../../features/chat/components/JoinGroupModal';
import GroupSettingsModal from '../../features/chat/components/GroupSettingsModal';
import { groupServices } from '../../api/group-services';

// Definición aproximada del modelo de Django
export interface GroupData {
  id: number;
  name: string;
  room_id: number;
  membership?: {
    role: 'admin' | 'member';
    status: 'pending' | 'accepted';
  };
}

export default function Sidebar() {
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  
  // Settings Modal State
  const [selectedGroupForSettings, setSelectedGroupForSettings] = useState<GroupData | null>(null);

  const [groups, setGroups] = useState<GroupData[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);

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
  const handleModalClose = () => {
    setShowCreate(false);
    setShowJoin(false);
    setSelectedGroupForSettings(null);
    loadGroups();
  };

  return (
    <>
      <div className="h-100 w-100 p-3 bg-sidebar border-end border-custom d-flex flex-column">
        
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h6 className="text-white mb-0 fw-bold">Contactos y Grupos</h6>
        </div>

        {/* Acciones de Grupo */}
        <div className="d-flex gap-2 mb-4">
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
            groups.map((group) => (
              <div 
                key={group.id} 
                className="d-flex align-items-center mb-2 p-2 rounded position-relative" 
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background-color 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
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
                  <div className="flex-grow-1 overflow-hidden d-flex align-items-center justify-content-between">
                    <div className="d-flex flex-column text-truncate text-white">
                      <h6 className="mb-0 text-truncate" style={{ fontSize: '0.95rem' }}>{group.name}</h6>
                      <small className="text-muted-custom text-truncate" style={{ fontSize: '0.75rem' }}>
                        {group.membership?.status === 'pending' ? 'Esperando aceptación' : `Room #${group.room_id || 'N/A'}`}
                      </small>
                    </div>

                    {/* Controles para Administradores de Grupo */}
                    <div className="d-flex align-items-center">
                       {group.membership?.role === 'admin' && (
                         <WorkspacePremiumIcon 
                            className="ms-1" 
                            style={{ color: '#FFD700', filter: 'drop-shadow(0px 0px 4px rgba(255, 215, 0, 0.4))', fontSize: '1.2rem' }} 
                            titleAccess="Eres Administrador del Grupo"
                         />
                       )}
                       
                       {group.membership?.role === 'admin' && (
                         <button 
                            className="btn btn-sm btn-link text-white-50 p-0 ms-1"
                            onClick={(e) => {
                              e.stopPropagation(); // Evitar que el click propague apertura de chat
                              setSelectedGroupForSettings(group);
                            }}
                            title="Configurar Grupo"
                         >
                            <MoreVertIcon fontSize="small" className="hover-white" style={{ transition: 'color 0.2s' }} />
                         </button>
                       )}
                    </div>

                  </div>
              </div>
            ))
          )}
        </div>
        
        {/* Botón flotante o acción inferior para el Sidebar */}
        <div className="mt-auto pt-3 border-top border-custom">
          <div className="d-flex align-items-center text-white-50 small mt-2">
            <i className="bi bi-circle-fill me-2" style={{ fontSize: '8px', color: '#28a745' }}></i>
            Conectado de forma segura
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
