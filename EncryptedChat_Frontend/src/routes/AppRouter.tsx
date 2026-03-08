import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import PublicRoute from './PublicRoute';
import PrivateRoute from './PrivateRoute';

import Login from '../features/auth/views/Login';
import Chat from '../features/chat/views/Chat';

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Rutas Públicas */}
                <Route element={<PublicRoute />}>
                    <Route path="/login" element={<Login />} />
                </Route>

                {/* Rutas Privadas */}
                <Route element={<PrivateRoute />}>
                    <Route element={<AppLayout />}>
                        <Route path="/chat" element={<Chat />} />
                    </Route>
                </Route>

                {/* Redirección por defecto */}
                <Route path="*" element={<Navigate to="/chat" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
