import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CloseIcon from '@mui/icons-material/Close';
import TagIcon from '@mui/icons-material/Tag';
import { groupServices } from '../../../api/group-services';

interface JoinGroupModalProps {
  show: boolean;
  onClose: () => void;
}

export default function JoinGroupModal({ show, onClose }: JoinGroupModalProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const response = await groupServices.joinGroup(inviteCode.trim().toUpperCase());
      const isPending = response.membership?.status === 'pending';
      
      setSuccessMsg(
        isPending 
          ? 'Solicitud enviada. Debes esperar la aprobación del administrador.' 
          : `¡Te has unido exitosamente al grupo ${response.name || 'solicitado'}!`
      );
      
      setTimeout(() => {
        onClose();
        setInviteCode('');
        setSuccessMsg('');
      }, 3500);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'El código es inválido o el grupo ya está lleno.';
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop fade show"
            style={{ zIndex: 1040 }}
            onClick={onClose}
          />
          
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
                    <TagIcon className="me-2" />
                    Unirse a un Grupo
                  </h5>
                  <button type="button" className="btn text-white" onClick={onClose}>
                    <CloseIcon />
                  </button>
                </div>
                
                <form onSubmit={handleJoin}>
                  <div className="modal-body text-white">

                    <AnimatePresence>
                      {successMsg && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="alert alert-success alert-dismissible fade show small py-2" role="alert">
                          <strong>Éxito:</strong> {successMsg}
                          <button type="button" className="btn-close btn-close-white" style={{ filter: 'invert(1)' }} onClick={() => setSuccessMsg('')}></button>
                        </motion.div>
                      )}

                      {errorMsg && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="alert alert-danger alert-dismissible fade show small py-2" role="alert">
                          {errorMsg}
                          <button type="button" className="btn-close btn-close-white" onClick={() => setErrorMsg('')}></button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    <fieldset disabled={isLoading || successMsg !== ''}>
                      <div className="mb-3">
                      <label htmlFor="inviteCode" className="form-label text-white-50 small">Código de Invitación</label>
                      <input 
                        type="text" 
                        className="form-control text-center bg-sidebar border-custom text-white shadow-none fs-4 fw-bold letter-spacing-1" 
                        id="inviteCode" 
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        required
                        placeholder="XXXX-1234"
                        style={{ letterSpacing: '2px' }}
                        autoComplete="off"
                      />
                      <div className="form-text text-muted small mt-2">
                        Ingresa el código que te proporcionó el administrador del grupo. Si el grupo es privado, tu solicitud quedará en espera de aprobación.
                      </div>
                    </div>
                    </fieldset>
                  </div>
                  
                  <div className="modal-footer border-top border-custom">
                    <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={isLoading}>
                      Cancelar
                    </button>
                    <button type="submit" disabled={isLoading || successMsg !== ''} className="btn text-white text-uppercase fw-bold" style={{ backgroundColor: 'var(--brand-secondary)', minWidth: '130px' }}>
                      {isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Buscando...
                        </>
                      ) : (
                        'Ingresar'
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
