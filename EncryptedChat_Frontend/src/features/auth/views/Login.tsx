import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { authServices } from '../../../api/auth-services';
import { securityServices } from '../../../api/security-services';
import { CHAT_CRYPTO } from '../../../utils/crypto';
import Logo from '../../../assets/img/logo_mini.png';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    if (!successMsg && !error) return;

    const timer = setTimeout(() => {
      setSuccessMsg('');
      setError('');
    }, 4000);

    return () => clearTimeout(timer);
  }, [successMsg, error]);

  const isFormValid = () => {
    if (isRegistering) {
      return username.trim() !== '' && email.trim() !== '' && password.trim() !== '';
    }
    return username.trim() !== '' && password.trim() !== '';
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 50));

    try {
      if (isRegistering) {
        // Generar par de llaves RSA para el nuevo usuario
        const rsaKeys = CHAT_CRYPTO.generateRSAKeys();
        
        // Cifrar llave privada local usando la contraseña como llave simétrica AES
        let encPrivKey = "";
        if (rsaKeys.privateKey) {
            encPrivKey = CHAT_CRYPTO.encryptPrivateKey(rsaKeys.privateKey, password);
            CHAT_CRYPTO.saveMyPrivateKey(username, rsaKeys.privateKey);
        }

        // Llamada al endpoint de registro
        await authServices.register({
          username,
          email,
          password,
          public_key: rsaKeys.publicKey || '',
          encrypted_private_key: encPrivKey
        });

        // Si el registro es exitoso, volvemos a mostrar el formulario de login limpiando contraseña
        setIsRegistering(false);
        setPassword('');
        setSuccessMsg('¡Cuenta creada exitosamente! Por favor, inicia sesión.');
      } else {
        const response = await authServices.login(username, password);

        localStorage.setItem('access_token', response.access);
        localStorage.setItem('refresh_token', response.refresh);
        localStorage.setItem('username', username);

        // Verificar o reponer llaves RSA
        const privKey = CHAT_CRYPTO.getMyPrivateKey(username);
        if (!privKey) {
          // Browser nuevo, limpiado, o dispositivo móvil
          try {
            const vaultResp = await securityServices.getMyKeys();
            if (vaultResp && vaultResp.encrypted_private_key) {
               // Intentar descifrar la bóveda
               const recoveredKey = CHAT_CRYPTO.decryptPrivateKey(vaultResp.encrypted_private_key, password);
                if (recoveredKey && recoveredKey.includes("PRIVATE KEY")) {
                  CHAT_CRYPTO.saveMyPrivateKey(username, recoveredKey);
                } else {
                  // Contraseña de recuperación falló o formato inválido localmente
                  throw new Error("Local decryption vault failed");
                }
             } else {
                throw new Error("No vault found on server");
             }
          } catch {
             throw new Error("Error E2EE: No se pudo descargar tu Bóveda de Llaves por un fallo de conexión o la cuenta está corrupta. Intenta nuevamente.");
          }
        } else {
           try {
               const rsaPublicKey = CHAT_CRYPTO.getPublicKeyFromPrivate(username);
               if (rsaPublicKey) {
                   const encPrivKey = CHAT_CRYPTO.encryptPrivateKey(privKey, password);
                   securityServices.uploadKeys(rsaPublicKey, encPrivKey).catch(() => {});
               }
           } catch (e) {
               console.error("No se pudo respaldar la bóveda en 2do plano:", e);
           }
        }

        // Redirigir al chat
        navigate('/chat', { replace: true });
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error inesperado.';
      const lowerMsg = errorMessage.toLowerCase();
      let mappedError = errorMessage;

      if (lowerMsg.includes('credenciales') || lowerMsg.includes('no active account') || lowerMsg.includes('invalid') || lowerMsg.includes('incorrect') || lowerMsg.includes('bad request')) {
        mappedError = 'Error credenciales incorrectas';
      } else if (lowerMsg.includes('not found') || lowerMsg.includes('no encontrado')) {
        mappedError = 'Error usuario no encontrado';
      } else if (lowerMsg.includes('email') && (lowerMsg.includes('exists') || lowerMsg.includes('registrado') || lowerMsg.includes('already') || lowerMsg.includes('ya existe'))) {
        mappedError = 'Error este correo ya está registrado';
      } else if (lowerMsg.includes('username') && (lowerMsg.includes('exists') || lowerMsg.includes('registrado') || lowerMsg.includes('already') || lowerMsg.includes('ya existe'))) {
        mappedError = 'Error este usuario ya está registrado';
      } else if (lowerMsg.includes('username') && lowerMsg.includes('150')) {
        mappedError = 'El nombre de usuario no puede tener más de 150 caracteres';
      } else if (lowerMsg.includes('username') && (lowerMsg.includes('válido') || lowerMsg.includes('valid'))) {
        mappedError = 'El nombre de usuario contiene caracteres no permitidos';
      } else if (lowerMsg.includes('password') && (lowerMsg.includes('short') || lowerMsg.includes('common') || lowerMsg.includes('insegura') || lowerMsg.includes('al menos 8') || lowerMsg.includes('caracteres'))) {
        mappedError = 'Tu contraseña no es segura. Prueba una contraseña de 8 dígitos con al menos una letra mayúscula';
      } else if (lowerMsg.includes('failed to fetch') || lowerMsg.includes('network') || lowerMsg.includes('500') || lowerMsg.includes('conexión') || lowerMsg.includes('servidor')) {
        mappedError = 'Error en la conexión con el servidor';
      } else {
        mappedError = errorMessage || `Error al ${isRegistering ? 'registrar la cuenta' : 'iniciar sesión'}. Verifica tus datos.`;
      }

      setError(mappedError);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsRegistering(!isRegistering);
    setError('');
    setSuccessMsg('');
    setPassword('');
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
                <h2 className="text-center mb-2 text-brand-secondary fw-bold">
                  {isRegistering ? 'Crear Cuenta' : '¡Bienvenido!'}
                </h2>
                <p className="text-center mb-4 text-muted-custom">
                  {isRegistering ? 'Regístrate para usar el chat cifrado' : 'Ingresa tus credenciales para empezar a usar el chat'}
                </p>

                {successMsg && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="custom-alert-success fade show small py-2 px-3 mb-3 fw-medium rounded d-flex justify-content-between align-items-center shadow-sm"
                    role="alert"
                  >
                    <div><strong className="text-white me-1">¡Listo!</strong> <span className="text-white">{successMsg}</span></div>
                  </motion.div>
                )}

                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="custom-alert-danger fade show small py-2 px-3 mb-3 fw-medium rounded d-flex justify-content-between align-items-center shadow-sm" role="alert">
                    <span className="text-white">{error}</span>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="form-floating mb-3">
                    <input
                      type="text"
                      className="form-control bg-navbar text-white border-custom"
                      id="username"
                      placeholder=""
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setError('');
                        setSuccessMsg('');
                      }}
                      required
                      autoComplete="off"
                    />
                    <label htmlFor="username" className="text-secondary">
                      Usuario
                    </label>
                  </div>

                  <AnimatePresence>
                    {isRegistering && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ overflow: 'hidden' }}
                        className="form-floating mb-3"
                      >
                        <input
                          type="email"
                          className="form-control bg-navbar text-white border-custom"
                          id="email"
                          placeholder=""
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setError('');
                            setSuccessMsg('');
                          }}
                          required={isRegistering}
                          autoComplete="off"
                        />
                        <label htmlFor="email" className="text-secondary">
                          Correo electrónico
                        </label>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="form-floating mb-4 position-relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control bg-navbar text-white border-custom pe-5"
                      id="password"
                      placeholder=""
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                        setSuccessMsg('');
                      }}
                      required
                      autoComplete="off"
                    />
                    <label htmlFor="password" className="text-secondary">
                      Contraseña
                    </label>
                    <button
                      type="button"
                      className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-secondary"
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
                        {isRegistering ? 'Creando cuenta...' : 'Iniciando sesión...'}
                      </>
                    ) : (
                      isRegistering ? 'Completar Registro' : 'Iniciar Sesión'
                    )}
                  </motion.button>

                  <div className="text-center mt-3">
                    <span className="text-muted-custom">
                      {isRegistering ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
                    </span>
                    <a
                      href="#"
                      className="text-brand-secondary text-decoration-none fw-bold ms-2"
                      onClick={toggleMode}
                    >
                      {isRegistering ? 'Inicia Sesión' : 'Regístrate aquí'}
                    </a>
                  </div>
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
              EncryptedChat v1.0 - Copyright © 2026 StackFlow ACK
            </motion.p>
          </div>
        </div>
      </div>
    </div>
  );
}
