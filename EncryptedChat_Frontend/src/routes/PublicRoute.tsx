import { Navigate, Outlet } from 'react-router-dom';
import { authServices } from '../api/auth-services';

export default function PublicRoute() {
    if (authServices.isAuthenticated()) {
        return <Navigate to="/chat" replace />;
    }

    return <Outlet />;
}
