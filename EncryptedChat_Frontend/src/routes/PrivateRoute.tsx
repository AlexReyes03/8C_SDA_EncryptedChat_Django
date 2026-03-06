import { Navigate, Outlet } from 'react-router-dom';
import { authServices } from '../api/auth-services';
import { WebSocketProvider } from '../contexts/WebSocketContext';

export default function PrivateRoute() {
    // Si no está autenticado, lo enviamos al login
    if (!authServices.isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    // Si está autenticado, renderizamos las rutas hijas envueltas en el Provider de WS
    return (
        <WebSocketProvider>
            <Outlet />
        </WebSocketProvider>
    );
}
