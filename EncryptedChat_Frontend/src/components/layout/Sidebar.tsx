import { useState } from 'react';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import GroupIcon from '@mui/icons-material/Group';
import CreateGroupModal from '../../features/chat/components/CreateGroupModal';
import JoinGroupModal from '../../features/chat/components/JoinGroupModal';

export default function Sidebar() {
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

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
        
        {/* Ejemplo visual del estado de un grupo/chat */}
        <div className="d-flex align-items-center mb-3 p-2 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.05)', cursor: 'pointer' }}>
            <div
              className="rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0"
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: 'var(--brand-secondary)',
                color: '#fff',
                fontWeight: 'bold',
              }}
            >
              G
            </div>
            <div className="flex-grow-1 overflow-hidden">
              <h6 className="mb-0 text-white text-truncate">Grupo de Chat 1</h6>
              <small className="text-muted text-truncate d-block">Último mensaje...</small>
            </div>
        </div>
        
        {/* Botón flotante o acción inferior para el Sidebar */}
        <div className="mt-auto pt-3 border-top border-custom">
          <div className="d-flex align-items-center text-white-50 small mt-2">
            <i className="bi bi-circle-fill me-2" style={{ fontSize: '8px', color: '#28a745' }}></i>
            Conectado de forma segura
          </div>
        </div>
      </div>

      <CreateGroupModal show={showCreate} onClose={() => setShowCreate(false)} />
      <JoinGroupModal show={showJoin} onClose={() => setShowJoin(false)} />
    </>
  );
}
