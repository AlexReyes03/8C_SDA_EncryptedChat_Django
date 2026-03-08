import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CloseIcon from '@mui/icons-material/Close';
import TagIcon from '@mui/icons-material/Tag';
import { groupServices } from '../../../api/group-services';
import { useToast } from '../../../hooks/useToast';
import { mapDjangoErrors } from '../../../utils/error-mapper';

interface JoinGroupModalProps {
  show: boolean;
  onClose: () => void;
}

export default function JoinGroupModal({ show, onClose }: JoinGroupModalProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    if (!errorMsg) return;

    const timer = setTimeout(() => {
      setErrorMsg('');
    }, 4000);

    return () => clearTimeout(timer);
  }, [errorMsg]);

  useEffect(() => {
    if (!show) {
      setInviteCode('');
      setErrorMsg('');
    }
  }, [show]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const response = await groupServices.joinGroup(inviteCode.trim().toUpperCase());
      const isPending = response.membership?.status === 'pending';

      showToast(
        isPending
          ? 'Solicitud enviada. Debes esperar la aprobación del administrador.'
          : `¡Te has unido exitosamente al grupo ${response.name || 'solicitado'}!`
      );

      onClose();
      setInviteCode('');

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'El código es inválido o el grupo ya está lleno.';
      setErrorMsg(mapDjangoErrors(errorMessage, 'group'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!show) return null;

  return createPortal(
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
                  <h5 className="modal-title text-white fw-bold d-flex align-items-center">
                    <TagIcon className="me-2 text-white" />
                    Unirse a un Grupo
                  </h5>
                  <button type="button" className="btn text-white ms-auto" onClick={onClose}>
                    <CloseIcon />
                  </button>
                </div>

                <form onSubmit={handleJoin}>
                  <div className="modal-body text-white">

                    <AnimatePresence>
                      {errorMsg && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="alert alert-danger alert-dismissible fade show small py-2 fw-medium text-dark" role="alert" style={{ backgroundColor: '#dc3545', color: '#fff' }}>
                          <span className="text-white">{errorMsg}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <fieldset disabled={isLoading}>
                      <div className="mb-3">
                        <label htmlFor="inviteCode" className="form-label text-white fw-semibold small mb-2">Código de Invitación</label>
                        <input
                          type="text"
                          className="form-control text-center bg-sidebar border-custom text-white shadow-none fs-4 fw-bold letter-spacing-1"
                          id="inviteCode"
                          value={inviteCode}
                          onChange={(e) => {
                            let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                            if (value.length > 3) {
                              value = value.slice(0, 3) + '-' + value.slice(3, 7);
                            }
                            setInviteCode(value);
                            setErrorMsg('');
                          }}
                          required
                          maxLength={8}
                          placeholder="XXX-1234"
                          style={{ letterSpacing: '2px' }}
                          autoComplete="off"
                        />
                        <div className="form-text text-white-50 small mt-2">
                          Ingresa el código que te proporcionó el administrador del grupo. Si el grupo es privado, tu solicitud quedará en espera de aprobación.
                        </div>
                      </div>
                    </fieldset>
                  </div>

                  <div className="modal-footer border-top border-custom">
                    <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={isLoading}>
                      Cancelar
                    </button>
                    <button type="submit" disabled={isLoading} className="btn text-white text-uppercase fw-bold" style={{ backgroundColor: 'var(--brand-secondary)', minWidth: '130px' }}>
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
    </AnimatePresence>,
    document.body
  );
}
