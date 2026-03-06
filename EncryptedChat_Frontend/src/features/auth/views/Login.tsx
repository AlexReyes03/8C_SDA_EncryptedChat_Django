import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { authServices } from '../../../api/auth-services';
import Logo from '../../../assets/img/logo_mini.png';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const isFormValid = () => {
    return username.trim() !== '' && password.trim() !== '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setError('');
    setIsLoading(true);

    try {
      // Llamada real al servicio de Django usando el fetchWrapper
      const response = await authServices.login(username, password);
      
      localStorage.setItem('access_token', response.access);
      localStorage.setItem('refresh_token', response.refresh);
      // Opcionalmente guardar info del usuario parseando el JWT o tras otra petición:
      localStorage.setItem('username', username);
      
      // Redirigir al chat
      navigate('/chat', { replace: true });
      
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center position-relative bg-main overflow-hidden">
      {/* Background Dots Effect */}
      <div
        className="position-absolute w-100 h-100"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(136, 136, 136, 0.15) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          zIndex: 1,
        }}
      />

      <div className="container position-relative" style={{ zIndex: 2 }}>
        <div className="row justify-content-center">
          <div className="col-12 col-md-6 col-lg-5">
            <motion.div 
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-center mb-4"
            >
              <img
                src={Logo}
                alt="EncryptedChat"
                className="img-fluid mb-3"
                style={{ maxWidth: '80px' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              {/* Fallback en caso de no tener el logo al inicio */}
              <h1 className="fw-bold text-brand-primary">EncryptedChat</h1>
            </motion.div>

            <motion.div 
               initial={{ scale: 0.95, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               transition={{ duration: 0.5, delay: 0.2 }}
               className="card shadow-lg border-0 bg-sidebar text-primary rounded-4"
            >
              <div className="card-body p-4 p-md-5">
                <h2 className="text-center mb-2 text-brand-primary fw-bold">
                  ¡Bienvenido!
                </h2>
                <p className="text-center mb-4 text-muted-custom">
                  Ingresa tus credenciales para empezar a usar el chat
                </p>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="alert alert-danger alert-dismissible fade show" 
                    role="alert"
                  >
                    {error}
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={() => setError('')}
                    ></button>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="form-floating mb-3">
                    <input
                      type="text"
                      className="form-control bg-navbar text-primary border-custom"
                      id="username"
                      placeholder="Usuario"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                    <label htmlFor="username" className="text-secondary">
                      Usuario
                    </label>
                  </div>

                  <div className="form-floating mb-4 position-relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control bg-navbar text-primary border-custom pe-5"
                      id="password"
                      placeholder="Contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <label htmlFor="password" className="text-secondary">
                      Contraseña
                    </label>
                    <button
                      type="button"
                      className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-brand-primary"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ textDecoration: 'none', zIndex: 10 }}
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </button>
                  </div>

                  <motion.button
                    whileHover={{ scale: isFormValid() && !isLoading ? 1.02 : 1 }}
                    whileTap={{ scale: isFormValid() && !isLoading ? 0.98 : 1 }}
                    type="submit"
                    className="btn w-100 mb-3 text-white fw-bold py-2 rounded-3"
                    disabled={isLoading || !isFormValid()}
                    style={{
                      backgroundColor: isLoading || !isFormValid() ? '#555' : 'var(--brand-primary)',
                      border: 'none',
                      cursor: isLoading || !isFormValid() ? 'not-allowed' : 'pointer',
                      opacity: isLoading || !isFormValid() ? 0.6 : 1,
                    }}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Iniciando sesión...
                      </>
                    ) : (
                      'Iniciar Sesión'
                    )}
                  </motion.button>
                </form>
              </div>
            </motion.div>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center mt-4 text-muted-custom" 
              style={{ fontSize: '13px' }}
            >
              EncryptedChat v1.0 - Copyright © 2026 Seguridad Informática UTEZ
            </motion.p>
          </div>
        </div>
      </div>
    </div>
  );
}
