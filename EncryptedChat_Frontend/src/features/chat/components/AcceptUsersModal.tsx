import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { groupServices } from '../../../api/group-services';

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
}

export default function AcceptUsersModal({ show, onClose, groupId }: AcceptUsersModalProps) {
    const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
    const [isLoading, setIsLoading] = useState(false);

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
            const users = await groupServices.getGroupMembers(groupId);
            const pending = users.filter((u: PendingUser) => u.status === 'pending');
            setPendingUsers(pending);
        } catch (e) {
            console.error("Error cargando usuarios pendientes:", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAccept = async (userId: number) => {
        if (!groupId) return;
        try {
            await groupServices.acceptGroupMember(groupId, userId);
            setPendingUsers((prev) => prev.filter((u) => u.user_id !== userId));
        } catch (e) {
            console.error("Error al aceptar usuario:", e);
        }
    };

    const handleReject = async (userId: number) => {
        if (!groupId) return;
        try {
            await groupServices.rejectGroupMember(groupId, userId);
            setPendingUsers((prev) => prev.filter((u) => u.user_id !== userId));
        } catch (e) {
            console.error("Error al rechazar usuario:", e);
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
                                                <div key={user.id} className="list-group-item bg-transparent text-white border-bottom border-custom d-flex justify-content-between align-items-center py-3">
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
        </AnimatePresence>
    );
}
