import { motion, AnimatePresence } from 'framer-motion';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import type { ReactNode } from 'react';

interface ConfirmActionModalProps {
    show: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: ReactNode;
    message: ReactNode;
    subMessage?: ReactNode;
    confirmText: string;
    isLoading: boolean;
}

export default function ConfirmActionModal({
    show, onClose, onConfirm, title, message, subMessage, confirmText, isLoading
}: ConfirmActionModalProps) {
    if (!show) return null;

    return (
        <AnimatePresence>
            <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }} tabIndex={-1}>
                <div className="modal-dialog modal-dialog-centered">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="modal-content bg-sidebar border-custom"
                    >
                        <div className="modal-header border-bottom border-custom pb-2">
                            <h5 className="modal-title text-white d-flex align-items-center">
                                <ReportProblemIcon color="warning" className="me-2" />
                                {title}
                            </h5>
                            <button type="button" className="btn-close btn-close-white" onClick={onClose} disabled={isLoading}></button>
                        </div>
                        <div className="modal-body text-white-50">
                            {message}
                            {subMessage && <p className="small text-muted-custom mb-0 mt-2">{subMessage}</p>}
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
                                        Cargando...
                                    </>
                                ) : (
                                    confirmText
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </AnimatePresence>
    );
}
