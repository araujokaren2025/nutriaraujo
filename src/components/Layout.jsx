import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, LogOut } from 'lucide-react';

const Layout = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
    { id: 'pacientes', label: 'Pacientes', icon: <Users size={20} />, path: '/pacientes' },
  ];

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="logo">Nutri<span>System</span></div>
        <ul className="nav-menu">
          {menuItems.map((item) => (
            <li 
              key={item.id}
              className={`nav-item ${location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path)) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </li>
          ))}
        </ul>
        <div style={{ marginTop: 'auto' }}>
          <button onClick={signOut} className="btn-logout-sidebar">
            <LogOut size={20} style={{ marginRight: '10px' }} />
            Sair
          </button>
        </div>
      </aside>
      
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
