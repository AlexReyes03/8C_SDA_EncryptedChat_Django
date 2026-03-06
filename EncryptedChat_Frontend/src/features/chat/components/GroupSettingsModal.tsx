import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CloseIcon from '@mui/icons-material/Close';
import SettingsIcon from '@mui/icons-material/Settings';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import LogoutIcon from '@mui/icons-material/Logout';
import { groupServices } from '../../../api/group-services';
import type { UpdateGroupPayload } from '../../../api/group-services';
import type { GroupData } from '../../../components/layout/Sidebar';

interface GroupSettingsModalProps {
  show: boolean;
  onClose: () => void;
  group: GroupData | null;
}

export default function GroupSettingsModal({ show, onClose, group }: GroupSettingsModalProps) {
  const [formData, setFormData] = useState<UpdateGroupPayload>({
    name: '',
    is_private: false
  });
  
  // Extraemos invite_code por si viene en la metadata o el serializer.
  // Django no nos retornaba `invite_code` en `/me/` (si no venía), 
  // pero según el serializer del backend: GroupSerializer tiene "invite_code" a pesar de ser list API.
  const [inviteCode, setInviteCode] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (group && show) {
        setFormData({
            name: group.name,
            is_private: (group as unknown as Record<string, unknown>).is_private as boolean || false 
        });
        setInviteCode((group as unknown as Record<string, unknown>).invite_code as string || 'SIN-CÓDIGO');
        setErrorMsg('');
        setSuccessMsg('');
    }
  }, [group, show]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group) return;
    
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      await groupServices.updateGroup(group.id, formData);
      setSuccessMsg(`¡Configuraciones guardadas para ${formData.name}!`);
      
      // Cerrar y resetear después de unos segundos
      setTimeout(() => {
        onClose();
        setSuccessMsg('');
      }, 1500);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al intentar actualizar el grupo.';
      setErrorMsg(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!group) return;
    if (!window.confirm(`¿Estás seguro de que deseas eliminar permanentemente el grupo "${group.name}"? Esta acción no se puede deshacer.`)) {
        return;
    }
    
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      await groupServices.deleteGroup(group.id);
      setSuccessMsg('El grupo ha sido eliminado exitosamente.');
      
      setTimeout(() => {
        onClose();
        window.location.reload(); // Hard reload on delete to clean states
      }, 1500);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al intentar eliminar el grupo.';
      setErrorMsg(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!group) return;
    if (!window.confirm(`¿Estás seguro de que deseas abandonar el grupo "${group.name}"?`)) {
        return;
    }
    
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      await groupServices.leaveGroup(group.id);
      setSuccessMsg('Has abandonado el grupo exitosamente.');
      setTimeout(() => {
        onClose();
        window.location.reload(); // Recargar para limpiar
      }, 1500);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al intentar abandonar el grupo.';
      setErrorMsg(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!show || !group) return null;

  const isAdmin = group.membership?.role === 'admin';

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop fade show"
            style={{ zIndex: 1040 }}
            onClick={onClose}
          />
          
          {/* Modal Container */}
          <div className="modal fade show d-block" tabIndex={-1} style={{ zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered">
              <motion.div 
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="modal-content bg-main border-custom shadow-lg"
              >
                <div className="modal-header border-bottom border-custom bg-navbar">
                  <h5 className="modal-title text-white fw-bold d-flex align-items-center">
                    <SettingsIcon className="me-2 text-white" />
                    <span className="text-white">Configuración del Grupo</span>
                  </h5>
                  <button type="button" className="btn text-white ms-auto" onClick={onClose}>
                    <CloseIcon />
                  </button>
                </div>
                
                <form onSubmit={handleUpdate}>
                  <div className="modal-body text-white">
                    
                    <AnimatePresence>
                      {successMsg && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="alert alert-success alert-dismissible fade show small py-2 mb-3" role="alert">
                          <strong>¡Listo!</strong> {successMsg}
                          <button type="button" className="btn-close btn-close-white" style={{ filter: 'invert(1)' }} onClick={() => setSuccessMsg('')}></button>
                        </motion.div>
                      )}

                      {errorMsg && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="alert alert-danger alert-dismissible fade show small py-2 mb-3" role="alert">
                          {errorMsg}
                          <button type="button" className="btn-close btn-close-white" onClick={() => setErrorMsg('')}></button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Fila del Código de Invitación (Solo Lectura) */}
                    <div className="mb-4 p-3 bg-sidebar rounded border border-secondary border-opacity-25">
                       <label className="form-label text-brand-secondary fw-bold small mb-1">Código de Invitación</label>
                       <p className="text-white-50 small mb-2 lh-sm">
                           Comparte este código con quienes desees que entren a tu grupo privado.
                       </p>
                       <div className="input-group">
                          <input 
                              type="text" 
                              className="form-control bg-main border-custom text-white shadow-none fw-bold font-monospace" 
                              value={inviteCode}
                              readOnly
                          />
                           <button 
                             className="btn btn-outline-secondary d-flex align-items-center position-relative" 
                             style={{
                                borderColor: copied ? 'var(--bs-success)' : undefined
                             }}
                             type="button" 
                             onClick={handleCopyCode}
                             title={copied ? "Código copiado correctamente" : "Copiar Código"}
                           >
                             {copied ? <CheckCircleOutlineIcon fontSize="small" className="text-success"/> : <ContentCopyIcon fontSize="small"/>}
                             
                             {/* Tooltip flotante simulado */}
                             <AnimatePresence>
                               {copied && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="position-absolute bg-success text-white small rounded px-2 py-1 shadow-sm"
                                    style={{ top: '-35px', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', fontSize: '0.7rem' }}
                                  >
                                    Código copiado correctamente
                                  </motion.div>
                               )}
                             </AnimatePresence>
                           </button>
                        </div>
                    </div>

                    <fieldset disabled={isLoading || successMsg !== ''}>
                      {isAdmin ? (
                        <>
                          <div className="mb-3">
                            <label htmlFor="updateGroupName" className="form-label text-white-50 small">Nombre del Grupo</label>
                            <input 
                              type="text" 
                              className="form-control bg-sidebar border-custom text-white shadow-none" 
                              id="updateGroupName" 
                              name="name"
                              value={formData.name}
                              onChange={handleChange}
                              required
                              placeholder="Ej. Proyecto Alpha"
                              autoComplete="off"
                            />
                          </div>
                          
                          <div className="mb-3">
                            <label className="form-label text-white-50 small d-block">Privacidad del Grupo</label>
                            
                            <div className="form-check mb-2">
                              <input 
                                className="form-check-input" 
                                type="radio" 
                                name="is_private" 
                                id="updatePublicRadio" 
                                checked={!formData.is_private}
                                onChange={() => setFormData({ ...formData, is_private: false })}
                              />
                              <label className="form-check-label text-white small" htmlFor="updatePublicRadio">
                                <strong>Público:</strong> Acceso inmediato con el código.
                              </label>
                            </div>
                            
                            <div className="form-check">
                              <input 
                                className="form-check-input" 
                                type="radio" 
                                name="is_private" 
                                id="updatePrivateRadio" 
                                checked={formData.is_private}
                                onChange={() => setFormData({ ...formData, is_private: true })}
                              />
                              <label className="form-check-label text-white small" htmlFor="updatePrivateRadio">
                                <strong>Privado:</strong> Los usuarios requieren aprobación manual tuya.
                              </label>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="mb-3">
                           <p className="text-white-50 small">Solo los administradores pueden modificar los detalles del grupo.</p>
                        </div>
                      )}
                    </fieldset>
                  </div>
                  
                  <div className="modal-footer border-top border-custom d-flex justify-content-between">
                    <div>
                        {isAdmin ? (
                            <button 
                                type="button" 
                                className="btn btn-outline-danger fw-bold d-flex align-items-center" 
                                onClick={handleDelete} 
                                disabled={isLoading}
                                title="Eliminar grupo permanentemente"
                            >
                              <DeleteForeverIcon />
                            </button>
                        ) : (
                            <button 
                                type="button" 
                                className="btn btn-outline-danger fw-bold d-flex align-items-center" 
                                onClick={handleLeaveGroup} 
                                disabled={isLoading}
                                title="Abandonar este grupo"
                            >
                              <LogoutIcon className="me-1" fontSize="small"/> Abandonar Grupo
                            </button>
                        )}
                    </div>
                    <div className="d-flex gap-2">
                        <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={isLoading}>
                          Cerrar
                        </button>
                        {isAdmin && (
                            <button type="submit" disabled={isLoading || successMsg !== ''} className="btn btn-brand-primary text-white fw-bold" style={{ backgroundColor: 'var(--brand-primary)', minWidth: '150px' }}>
                               {isLoading ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                  Guardando...
                                </>
                              ) : (
                                'Guardar Cambios'
                              )}
                            </button>
                        )}
                    </div>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
