import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function AppLayout() {
  return (
    <div className="vh-100 d-flex flex-column bg-main overflow-hidden">
      <Navbar />
      
      <div className="container-fluid flex-grow-1 overflow-hidden p-0">
        <div className="row h-100 m-0">
          <div className="col-3 h-100 p-0 bg-sidebar">
            <Sidebar />
          </div>
          
          <div className="col-9 h-100 p-0 bg-main d-flex flex-column position-relative">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
