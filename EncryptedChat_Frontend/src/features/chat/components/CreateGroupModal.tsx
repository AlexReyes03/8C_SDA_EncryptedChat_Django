import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CloseIcon from '@mui/icons-material/Close';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import { groupServices } from '../../../api/group-services';

interface CreateGroupModalProps {
  show: boolean;
  onClose: () => void;
}

export default function CreateGroupModal({ show, onClose }: CreateGroupModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    max_participants: 50,
    is_private: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const response = await groupServices.createGroup(formData);
      setSuccessMsg(`¡Grupo creado exitosamente! Código: ${response.invite_code}`);
      
      // Cerrar y resetear después de unos segundos
      setTimeout(() => {
        onClose();
        setFormData({ name: '', max_participants: 50, is_private: false });
        setSuccessMsg('');
      }, 3000);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido de red al intentar crear el grupo.';
      setErrorMsg(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!show) return null;

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
                  <h5 className="modal-title text-brand-primary fw-bold d-flex align-items-center">
                    <GroupAddIcon className="me-2" />
                    Crear Nuevo Grupo
                  </h5>
                  <button type="button" className="btn text-white" onClick={onClose}>
                    <CloseIcon />
                  </button>
                </div>
                
                <form onSubmit={handleCreate}>
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

                    <fieldset disabled={isLoading || successMsg !== ''}>
                      <div className="mb-3">
                      <label htmlFor="groupName" className="form-label text-white-50 small">Nombre del Grupo</label>
                      <input 
                        type="text" 
                        className="form-control bg-sidebar border-custom text-white shadow-none" 
                        id="groupName" 
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Ej. Proyecto Alpha"
                        autoComplete="off"
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="maxParticipants" className="form-label text-white-50 small">Límite de Participantes</label>
                      <input 
                        type="number" 
                        className="form-control bg-sidebar border-custom text-white shadow-none" 
                        id="maxParticipants" 
                        name="max_participants"
                        min="2"
                        value={formData.max_participants}
                        onChange={handleChange}
                        required
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
                          id="publicRadio" 
                          checked={!formData.is_private}
                          onChange={() => setFormData({ ...formData, is_private: false })}
                        />
                        <label className="form-check-label text-white small" htmlFor="publicRadio">
                          <strong>Público:</strong> Cualquiera con el código o enlace puede unirse automáticamente.
                        </label>
                      </div>
                      
                      <div className="form-check">
                        <input 
                          className="form-check-input" 
                          type="radio" 
                          name="is_private" 
                          id="privateRadio" 
                          checked={formData.is_private}
                          onChange={() => setFormData({ ...formData, is_private: true })}
                        />
                        <label className="form-check-label text-white small" htmlFor="privateRadio">
                          <strong>Privado:</strong> Los usuarios solicitan acceso y deben ser aceptados por el Administrador.
                        </label>
                      </div>
                    </div>
                    
                    <div className="alert alert-info bg-brand-primary border-0 text-white small mb-0 mt-4 rounded-3 d-flex align-items-center" role="alert" style={{ '--bs-bg-opacity': .2 } as React.CSSProperties}>
                      <i className="bi bi-info-circle me-2"></i>
                      Se te asignará automáticamente el rol de Administrador. Podrás transferirlo más adelante.
                    </div>
                    </fieldset>
                  </div>
                  
                  <div className="modal-footer border-top border-custom">
                    <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={isLoading}>
                      Cancelar
                    </button>
                    <button type="submit" disabled={isLoading || successMsg !== ''} className="btn btn-brand-primary text-white fw-bold" style={{ backgroundColor: 'var(--brand-primary)', minWidth: '150px' }}>
                       {isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Creando...
                        </>
                      ) : (
                        'Crear Grupo'
                      )}
                    </button>
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
