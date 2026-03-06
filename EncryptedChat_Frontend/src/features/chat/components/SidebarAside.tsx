import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CloseIcon from '@mui/icons-material/Close';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { groupServices } from '../../../api/group-services';
import type { GroupData } from '../../../components/layout/Sidebar';
import AcceptUsersModal from './AcceptUsersModal';

interface SidebarAsideProps {
    show: boolean;
    onClose: () => void;
    activeGroupInfo: GroupData | null;
}

interface GroupMemberData {
    id: number;
    user_id: number;
    username: string;
    role: string;
    status: string;
}

export default function SidebarAside({ show, onClose, activeGroupInfo }: SidebarAsideProps) {
    const [members, setMembers] = useState<GroupMemberData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showAcceptModal, setShowAcceptModal] = useState(false);

    useEffect(() => {
        if (show && activeGroupInfo) {
            loadMembers();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show, activeGroupInfo]);

    const loadMembers = async () => {
        if (!activeGroupInfo) return;
        setIsLoading(true);
        try {
            const data = await groupServices.getGroupMembers(activeGroupInfo.id);
            setMembers(data);
        } catch (e) {
            console.error("Error al cargar miembros del grupo", e);
        } finally {
            setIsLoading(false);
        }
    };

    const isAdmin = activeGroupInfo?.membership?.role === 'admin';
    const activeMembers = members.filter(m => m.status === 'accepted');
    const pendingMembers = members.filter(m => m.status === 'pending');

    return (
        <>
            <AnimatePresence>
                {show && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="h-100 bg-sidebar border-start border-custom shadow-lg position-absolute top-0 end-0 z-3 d-flex flex-column"
                        style={{ width: '300px' }}
                    >
                        {/* Header */}
                        <div className="p-3 border-bottom border-custom d-flex justify-content-between align-items-center">
                            <h6 className="mb-0 text-white fw-bold">Info. del Grupo</h6>
                            <button className="btn btn-sm text-secondary p-1" onClick={onClose}>
                                <CloseIcon />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-grow-1 overflow-auto p-3 p-md-4">
                            {isLoading ? (
                                <div className="text-center text-muted-custom mt-4">
                                    <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                                    <small>Cargando miembros...</small>
                                </div>
                            ) : (
                                <>
                                    {isAdmin && pendingMembers.length > 0 && (
                                        <div className="mb-4">
                                            <button
                                                className="btn btn-sm w-100 text-white d-flex align-items-center justify-content-center"
                                                style={{ backgroundColor: 'var(--brand-primary)' }}
                                                onClick={() => setShowAcceptModal(true)}
                                            >
                                                <PersonAddIcon fontSize="small" className="me-2" />
                                                Solicitudes ({pendingMembers.length})
                                            </button>
                                        </div>
                                    )}

                                    <h6 className="text-secondary small fw-bold mb-3">ACTIVOS ({activeMembers.length})</h6>
                                    <div className="list-group list-group-flush mb-4">
                                        {activeMembers.map((member) => (
                                            <div key={member.id} className="list-group-item bg-transparent text-white border-0 px-0 d-flex align-items-center mb-2">
                                                <div
                                                    className="rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                                                    style={{
                                                        width: '35px',
                                                        height: '35px',
                                                        backgroundColor: 'var(--brand-secondary)',
                                                        color: '#ffffff',
                                                        fontWeight: 'bold',
                                                        fontSize: '1rem',
                                                    }}
                                                >
                                                    {member.username.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="d-flex flex-column">
                                                    <span className="fw-medium text-truncate" style={{ maxWidth: '180px' }}>{member.username}</span>
                                                    <small className="text-muted-custom">
                                                        {member.role === 'admin' ? 'Administrador' : 'Miembro'}
                                                    </small>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {pendingMembers.length > 0 && (
                                        <>
                                            <h6 className="text-secondary small fw-bold mb-3">INACTIVOS / PENDIENTES ({pendingMembers.length})</h6>
                                            <div className="list-group list-group-flush mb-4 opacity-50">
                                                {pendingMembers.map((member) => (
                                                    <div key={member.id} className="list-group-item bg-transparent text-white border-0 px-0 d-flex align-items-center mb-2">
                                                        <div
                                                            className="rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                                                            style={{
                                                                width: '35px',
                                                                height: '35px',
                                                                backgroundColor: '#555',
                                                                color: '#ccc',
                                                                fontWeight: 'bold',
                                                                fontSize: '1rem',
                                                            }}
                                                        >
                                                            {member.username.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="d-flex flex-column">
                                                            <span className="fw-medium text-truncate text-muted-custom" style={{ maxWidth: '180px' }}>{member.username}</span>
                                                            <small className="text-muted-custom">Pendiente</small>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AcceptUsersModal
                show={showAcceptModal}
                onClose={() => {
                    setShowAcceptModal(false);
                    if (activeGroupInfo) loadMembers(); // Reload when closing the modal
                }}
                groupId={activeGroupInfo?.id || null}
            />
        </>
    );
}
