import { useNavigate } from 'react-router-dom';
import { authServices } from '../../api/auth-services';
import LogoutIcon from '@mui/icons-material/Logout';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

export default function Navbar() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'Usuario';
  const initial = username.charAt(0).toUpperCase();

  const handleLogout = () => {
    authServices.logout();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="navbar navbar-expand-lg px-4 py-2 bg-sidebar border-bottom border-custom" style={{ minHeight: '65px', zIndex: 10 }}>
      <div className="container-fluid">
        {/* Brand / Logo */}
        <div className="d-flex align-items-center">
          <div className="bg-brand-primary rounded p-1 me-2 d-flex align-items-center justify-content-center">
            <ChatBubbleOutlineIcon style={{ color: '#fff', fontSize: '1.2rem' }} />
          </div>
          <span className="navbar-brand mb-0 h1 text-white fw-bold fs-5 tracking-wide">
            Encrypted<span className="text-brand-primary">Chat</span>
          </span>
        </div>

        {/* User Profile & Actions */}
        <div className="d-flex align-items-center ms-auto">
          <div className="d-none d-md-flex flex-column text-end me-3">
            <span className="text-white fw-semibold mb-1">{username}</span>
            <span className="text-white-50 ms-auto" style={{ fontSize: '0.75rem' }}>
              <span className="d-inline-block bg-success rounded-circle me-1" style={{ width: '6px', height: '6px' }}></span>
              En línea
            </span>
          </div>

          <div className="dropdown">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center bg-brand-primary text-white fw-bold dropdown-toggle shadow-sm transition-all"
              style={{
                width: '50px',
                height: '50px',
                fontSize: '1.1rem',
                cursor: 'pointer',
                border: '2px solid rgba(255,255,255,0.1)'
              }}
              id="userDropdown"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              title="Opciones de cuenta"
            >
              {initial}
            </div>

            <ul className="dropdown-menu dropdown-menu-end bg-sidebar border-custom shadow-lg mt-2" aria-labelledby="userDropdown">
              <li className="px-3 py-2 d-md-none border-bottom border-custom mb-1">
                <div className="d-flex align-items-center">
                  <AccountCircleIcon className="text-white-50 me-2" fontSize="small" />
                  <span className="text-white small">{username}</span>
                </div>
              </li>
              <li>
                <button
                  className="dropdown-item text-danger fw-medium d-flex align-items-center py-2 transition-all hover-bg-custom"
                  onClick={handleLogout}
                >
                  <LogoutIcon fontSize="small" className="me-2" />
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
