import { Navigate, Outlet } from 'react-router-dom';
import { authServices } from '../api/auth-services';
import { WebSocketProvider } from '../contexts/WebSocketProvider';

export default function PrivateRoute() {
    if (!authServices.isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    return (
        <WebSocketProvider>
            <Outlet />
        </WebSocketProvider>
    );
}
