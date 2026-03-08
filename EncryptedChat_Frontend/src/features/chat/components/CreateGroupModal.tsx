import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CloseIcon from '@mui/icons-material/Close';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import { groupServices } from '../../../api/group-services';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { useToast } from '../../../hooks/useToast';
import { CHAT_CRYPTO } from '../../../utils/crypto';
import { mapDjangoErrors } from '../../../utils/error-mapper';

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

  const { setActiveGroupId } = useWebSocket();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!errorMsg) return;

    const timer = setTimeout(() => {
      setErrorMsg('');
    }, 5000);

    return () => clearTimeout(timer);
  }, [errorMsg]);

  useEffect(() => {
    if (!show) {
      setFormData({ name: '', max_participants: 50, is_private: false });
      setErrorMsg('');
    }
  }, [show]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
    setErrorMsg('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const username = localStorage.getItem('username');
      if (!username) throw new Error("No has iniciado sesión correctamente.");

      const pubKey = CHAT_CRYPTO.getPublicKeyFromPrivate(username);
      if (!pubKey) throw new Error("Tu sesión es inválida. Cierra sesión y vuelve a entrar.");

      // Generar llave de grupo AES
      const aesKey = CHAT_CRYPTO.generateGroupAESKey();

      // Encriptar la nueva llave AES con nuestra llave Pública RSA
      const encryptedAES = CHAT_CRYPTO.encryptRSA(pubKey, aesKey);

      if (!encryptedAES) throw new Error("Error de seguridad al crear el grupo.");

      const payload = {
        ...formData,
        encrypted_symmetric_key: encryptedAES,
        ...(formData.is_private ? {} : { raw_aes_key: aesKey })
      };

      const response = await groupServices.createGroup(payload);
      showToast('¡Grupo creado exitosamente!');

      // Select the active group id right away
      if (response && response.id) {
        setActiveGroupId(response.id);
      }

      // Cerrado instantáneo y reset
      onClose();
      setFormData({ name: '', max_participants: 50, is_private: false });

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al intentar crear el grupo.';
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
                    <GroupAddIcon className="me-2 text-white" />
                    Crear Nuevo Grupo
                  </h5>
                  <button type="button" className="btn text-white ms-auto" onClick={onClose}>
                    <CloseIcon />
                  </button>
                </div>

                <form onSubmit={handleCreate}>
                  <div className="modal-body text-white">

                    <AnimatePresence>
                      {errorMsg && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="custom-alert-danger fade show small py-2 px-3 mb-3 fw-medium rounded d-flex justify-content-between align-items-center shadow-sm" role="alert">
                          <span className="text-white">{errorMsg}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <fieldset disabled={isLoading}>
                      <div className="mb-3">
                        <label htmlFor="groupName" className="form-label text-white fw-semibold small mb-2">Nombre del Grupo</label>
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
                        <label htmlFor="maxParticipants" className="form-label text-white fw-semibold small mb-2">Límite de Participantes</label>
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
                        <label className="form-label text-white fw-semibold small d-block mb-2">Privacidad del Grupo</label>

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

                    </fieldset>
                  </div>

                  <div className="modal-footer border-top border-custom">
                    <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={isLoading}>
                      Cancelar
                    </button>
                    <button type="submit" disabled={isLoading} className="btn btn-brand-primary text-white fw-bold" style={{ backgroundColor: 'var(--brand-primary)', minWidth: '150px' }}>
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
    </AnimatePresence>,
    document.body
  );
}
