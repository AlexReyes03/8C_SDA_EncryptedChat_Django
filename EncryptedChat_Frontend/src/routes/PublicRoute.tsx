import { Navigate, Outlet } from 'react-router-dom';
import { authServices } from '../api/auth-services';

export default function PublicRoute() {
    // Si ya está autenticado y trata de ir al login, lo redirigimos al chat
    if (authServices.isAuthenticated()) {
        return <Navigate to="/chat" replace />;
    }

    // Si NO está autenticado, renderizamos la ruta pública (ej. Login)
    return <Outlet />;
}
