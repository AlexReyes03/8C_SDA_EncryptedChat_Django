import { useNavigate } from 'react-router-dom';
import { authServices } from '../../api/auth-services';
import logoMini from '../../assets/img/logo_mini.png';

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // 1. Limpiar localStorage
    authServices.logout();
    // 2. Redireccionar al login asegurando que se evalúa la ruta
    navigate('/login', { replace: true });
  };

  return (
    <nav className="navbar navbar-dark px-3 py-2 bg-navbar w-100" style={{ minHeight: '60px', zIndex: 10 }}>
      <div className="container-fluid">
        <div className="d-flex align-items-center">
          <img src={logoMini} alt="Logo" className="me-2" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
          <span className="navbar-brand mb-0 h1 text-brand-primary fw-bold text-white">
            EncryptedChat
          </span>
        </div>

        <div className="d-flex align-items-center">
            <span className="text-white-50 small me-3">
              {localStorage.getItem('username') || 'Usuario Conectado'}
            </span>
            <div className="dropdown">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center bg-brand-primary text-white fw-bold dropdown-toggle"
                style={{
                  width: '35px',
                  height: '35px',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
                id="userDropdown"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                {(localStorage.getItem('username') || 'U')[0].toUpperCase()}
              </div>
              <ul className="dropdown-menu dropdown-menu-end bg-sidebar border-custom shadow" aria-labelledby="userDropdown">
                <li>
                  <button 
                    className="dropdown-item text-danger fw-medium d-flex align-items-center" 
                    onClick={handleLogout}
                  >
                    Cerrar Sesión
                  </button>
                </li>
              </ul>
            </div>
        </div>
      </div>
    </nav>
  );
}
