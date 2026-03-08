import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { groupServices } from '../../../api/group-services';
import { securityServices } from '../../../api/security-services';
import { CHAT_CRYPTO } from '../../../utils/crypto';
import ConfirmActionModal from './ConfirmActionModal';

interface AcceptUsersModalProps {
    show: boolean;
    onClose: () => void;
    groupId: number | null;
}

interface PendingUser {
    id: number;
    user_id: number;
    username: string;
    status: string;
    encrypted_symmetric_key?: string;
}

export default function AcceptUsersModal({ show, onClose, groupId }: AcceptUsersModalProps) {
    const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorModal, setErrorModal] = useState<{ show: boolean, message: string }>({ show: false, message: '' });

    useEffect(() => {
        if (show && groupId) {
            loadPendingUsers();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show, groupId]);

    const [myEncryptedKey, setMyEncryptedKey] = useState<string>('');

    useEffect(() => {
        if (show && groupId) {
            loadPendingUsers();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show, groupId]);

    const loadPendingUsers = async () => {
        if (!groupId) return;
        setIsLoading(true);
        try {
            const users: PendingUser[] = await groupServices.getGroupMembers(groupId);
            const pending = users.filter(u => u.status === 'pending');
            setPendingUsers(pending);

            const myUsername = localStorage.getItem('username');
            const me = users.find(u => u.username === myUsername);
            if (me && me.encrypted_symmetric_key) {
                setMyEncryptedKey(me.encrypted_symmetric_key);
            }
        } catch {
            // Ignorado silenciosamente para no saturar consola
        } finally {
            setIsLoading(false);
        }
    };

    const handleAccept = async (userId: number) => {
        if (!groupId) return;
        try {
            // E2EE: Re-encriptar la llave AES del grupo para el nuevo usuario
            const myUsername = localStorage.getItem('username');
            if (!myUsername) throw new Error("No hay usuario activo.");

            const myPrivKey = CHAT_CRYPTO.getMyPrivateKey(myUsername);
            if (!myPrivKey) throw new Error("No tienes llave privada RSA. Cierra sesión y vuelve a entrar.");

            if (!myEncryptedKey) throw new Error("No se pudo obtener tu copia de la llave AES del grupo.");

            // Descifrar llave AES temporalmente en memoria
            const aesKey = CHAT_CRYPTO.decryptRSA(myPrivKey, myEncryptedKey);
            if (!aesKey) throw new Error("No se pudo descifrar la llave AES del grupo.");

            // Obtener llave Pública RSA del usuario solicitante
            const targetPubKeyResp = await securityServices.getPublicKey(userId);
            if (!targetPubKeyResp.key_data) throw new Error("El usuario no ha subido su Llave Pública RSA.");

            // Cifrar la AES con su llave Pública
            const reEncryptedAES = CHAT_CRYPTO.encryptRSA(targetPubKeyResp.key_data, aesKey);
            if (!reEncryptedAES) throw new Error("Fallo al cifrar AES para el nuevo miembro.");

            await groupServices.acceptGroupMember(groupId, userId, reEncryptedAES);
            setPendingUsers((prev) => prev.filter((u) => u.user_id !== userId));
        } catch (e) {
            setErrorModal({ show: true, message: e instanceof Error ? e.message : "Error al procesar la solicitud." });
        }
    };

    const handleReject = async (userId: number) => {
        if (!groupId) return;
        try {
            await groupServices.rejectGroupMember(groupId, userId);
            setPendingUsers((prev) => prev.filter((u) => u.user_id !== userId));
        } catch {
            // Error ignorado
        }
    };

    return (
        <AnimatePresence>
            {show && (
                <React.Fragment>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="modal-backdrop fade show"
                        style={{ zIndex: 1050 }}
                        onClick={onClose}
                    />
                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="modal d-block"
                        tabIndex={-1}
                        style={{ zIndex: 1055, backgroundColor: 'rgba(0,0,0,0.5)' }}
                    >
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content bg-sidebar border-custom text-white">
                                <div className="modal-header border-bottom border-custom">
                                    <h5 className="modal-title fw-bold">Solicitudes Pendientes</h5>
                                    <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
                                </div>
                                <div className="modal-body">
                                    {isLoading ? (
                                        <div className="text-center my-4">
                                            <div className="spinner-border spinner-border-sm text-brand-primary" role="status">
                                                <span className="visually-hidden">Cargando...</span>
                                            </div>
                                        </div>
                                    ) : pendingUsers.length === 0 ? (
                                        <div className="text-center text-muted-custom my-4">
                                            No hay solicitudes pendientes.
                                        </div>
                                    ) : (
                                        <div className="list-group list-group-flush">
                                            {pendingUsers.map((user) => (
                                                <div key={user.id} className="list-group-item bg-transparent text-white d-flex justify-content-between align-items-center py-3">
                                                    <div className="d-flex align-items-center">
                                                        <div
                                                            className="rounded-circle d-flex align-items-center justify-content-center me-3"
                                                            style={{
                                                                width: '40px',
                                                                height: '40px',
                                                                backgroundColor: 'var(--brand-secondary)',
                                                                color: '#ffffff',
                                                                fontWeight: 'bold'
                                                            }}
                                                        >
                                                            {user.username.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <h6 className="mb-0">{user.username}</h6>
                                                        </div>
                                                    </div>
                                                    <div className="d-flex gap-2">
                                                        <button
                                                            className="btn btn-sm btn-success d-flex align-items-center justify-content-center"
                                                            onClick={() => handleAccept(user.user_id)}
                                                            title="Aceptar"
                                                        >
                                                            <CheckCircleIcon fontSize="small" />
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-danger d-flex align-items-center justify-content-center"
                                                            onClick={() => handleReject(user.user_id)}
                                                            title="Rechazar"
                                                        >
                                                            <CancelIcon fontSize="small" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </React.Fragment>
            )}

            <ConfirmActionModal
                show={errorModal.show}
                onClose={() => setErrorModal({ show: false, message: '' })}
                onConfirm={() => setErrorModal({ show: false, message: '' })}
                title="Error"
                message={errorModal.message}
                confirmText="Aceptar"
                isLoading={false}
            />
        </AnimatePresence>
    );
}
