import { motion, AnimatePresence } from 'framer-motion';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';

interface ConfirmKickModalProps {
    show: boolean;
    onClose: () => void;
    onConfirm: () => void;
    username: string;
    isLoading: boolean;
}

export default function ConfirmKickModal({ show, onClose, onConfirm, username, isLoading }: ConfirmKickModalProps) {
    if (!show) return null;

    return (
        <AnimatePresence>
            <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
                <div className="modal-dialog modal-dialog-centered">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="modal-content bg-sidebar border-custom"
                    >
                        <div className="modal-header border-bottom border-custom pb-2">
                            <h5 className="modal-title text-white d-flex align-items-center">
                                <ReportProblemIcon className="me-2" />
                                Confirmar Expulsión
                            </h5>
                            <button type="button" className="btn-close btn-close-white" onClick={onClose} disabled={isLoading}></button>
                        </div>
                        <div className="modal-body text-white-50">
                            <p>¿Estás seguro de que deseas expulsar al usuario <strong className="text-white">{username}</strong> del grupo?</p>
                            <p className="small text-muted-custom mb-0">Esta acción no puede deshacerse de inmediato y el usuario requerirá una nueva invitación o solicitud para volver a ingresar.</p>
                        </div>
                        <div className="modal-footer border-top border-custom pt-3">
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={onClose}
                                disabled={isLoading}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm btn-danger d-flex align-items-center"
                                onClick={onConfirm}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Expulsando...
                                    </>
                                ) : (
                                    'Expulsar Usuario'
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </AnimatePresence>
    );
}
