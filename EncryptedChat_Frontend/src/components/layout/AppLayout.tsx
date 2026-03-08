import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import logoMini from '../../assets/img/logo_mini.png';

export default function AppLayout() {
  return (
    <div className="vh-100 d-flex flex-column bg-main overflow-hidden">
      <Navbar />

      <div className="container-fluid flex-grow-1 overflow-hidden p-0">
        <div className="row h-100 m-0">
          <div className="col-md-4 col-lg-3 d-none d-md-block h-100 p-0 bg-sidebar">
            <Sidebar />
          </div>

          <div className="col-12 col-md-8 col-lg-9 h-100 p-0 bg-main d-flex flex-column position-relative">
            <Outlet />
          </div>
        </div>
      </div>

        {/* Offcanvas para Mobile Sidebar */}
        <div className="offcanvas offcanvas-start bg-sidebar border-end border-custom" tabIndex={-1} id="mobileSidebar" aria-labelledby="mobileSidebarLabel" style={{ width: '300px' }}>
          <div className="offcanvas-header border-bottom border-custom p-3 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <img src={logoMini} alt="Logo" className="me-2" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
              <span className="h5 mb-0 text-white fw-bold">Menú</span>
            </div>
            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close"></button>
          </div>
          <div className="offcanvas-body p-0 d-flex flex-column overflow-hidden">
            <Sidebar />
          </div>
        </div>
      </div>
  );
}
