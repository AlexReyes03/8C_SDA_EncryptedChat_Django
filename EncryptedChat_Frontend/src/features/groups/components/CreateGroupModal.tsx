import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CloseIcon from '@mui/icons-material/Close';
import GroupAddIcon from '@mui/icons-material/GroupAdd';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implementar llamada al backend (groupServices.createGroup(formData))
    console.log('Datos del grupo a crear:', formData);
    onClose();
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
                  </div>
                  
                  <div className="modal-footer border-top border-custom">
                    <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-brand-primary text-white text-uppercase fw-bold" style={{ backgroundColor: 'var(--brand-primary)' }}>
                      Crear Grupo
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
