
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { LuTicket, LuClock, LuCalendar, LuMapPin, LuLogOut, LuPlay, LuLayoutDashboard, LuSettings } from 'react-icons/lu';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAdmin, isOrganizer, isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
    setProfileOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {}
        <Link to="/" className="navbar-logo">
          <span className="logo-icon" style={{ display: 'flex', alignItems: 'center' }}><LuTicket /></span>
          <span className="logo-text gradient-text">TicketMaster</span>
        </Link>

        {}
        <div className="navbar-links">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>Events</Link>
          {isOrganizer && (
            <Link to="/organizer/dashboard" className={`nav-link ${location.pathname.startsWith('/organizer') ? 'active' : ''}`}>
              Your Events
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin/dashboard" className={`nav-link ${location.pathname.startsWith('/admin') ? 'active' : ''}`}>
              Admin
            </Link>
          )}
        </div>

        {}
        <div className="navbar-auth">
          {isAuthenticated ? (
            <div className="profile-menu">
              <button
                className="profile-btn"
                onClick={() => setProfileOpen(!profileOpen)}
                id="profile-menu-btn"
              >
                <div className="avatar">{user?.name?.charAt(0).toUpperCase()}</div>
                <span className="profile-name">{user?.name?.split(' ')[0]}</span>
                <span className={`chevron ${profileOpen ? 'open' : ''}`}>▾</span>
              </button>

              {profileOpen && (
                <div className="dropdown" id="profile-dropdown">
                  <div className="dropdown-header">
                    <div className="dropdown-name">{user?.name}</div>
                    <div className="dropdown-email">{user?.email}</div>
                    <span className={`badge badge-primary`}>{user?.role}</span>
                  </div>
                  <div className="dropdown-divider" />
                  {user?.role === 'customer' && (
                    <Link to="/bookings" className="dropdown-item" onClick={() => setProfileOpen(false)}>
                      <LuTicket style={{ marginRight: '8px' }} /> My Bookings
                    </Link>
                  )}
                  {user?.role === 'customer' && (
                    <Link to="/waitlists" className="dropdown-item" onClick={() => setProfileOpen(false)}>
                      <LuClock style={{ marginRight: '8px' }} /> My Waitlists
                    </Link>
                  )}

                  {isAdmin && (
                    <Link to="/admin/venues" className="dropdown-item" onClick={() => setProfileOpen(false)}>
                      <LuMapPin style={{ marginRight: '8px' }} /> Venues
                    </Link>
                  )}
                  <div className="dropdown-divider" />
                  <button className="dropdown-item danger" onClick={handleLogout} id="logout-btn">
                    <LuLogOut style={{ marginRight: '8px' }} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
            </div>
          )}

          {}
          <button
            className={`hamburger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {}
      {menuOpen && (
        <div className="mobile-menu">
          <Link to="/" className="mobile-link" onClick={() => setMenuOpen(false)}>
            <LuPlay style={{ marginRight: '8px' }} /> Events
          </Link>
          {isAuthenticated ? (
            <>
              {user?.role === 'customer' && (
                <Link to="/bookings" className="mobile-link" onClick={() => setMenuOpen(false)}>
                  <LuTicket style={{ marginRight: '8px' }} /> My Bookings
                </Link>
              )}
              {isOrganizer && (
                <Link to="/organizer/dashboard" className="mobile-link" onClick={() => setMenuOpen(false)}>
                  <LuLayoutDashboard style={{ marginRight: '8px' }} /> Dashboard
                </Link>
              )}
              {isAdmin && (
                <Link to="/admin/dashboard" className="mobile-link" onClick={() => setMenuOpen(false)}>
                  <LuSettings style={{ marginRight: '8px' }} /> Admin
                </Link>
              )}
              <button className="mobile-link danger" onClick={handleLogout}>
                <LuLogOut style={{ marginRight: '8px' }} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="mobile-link" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/register" className="mobile-link" onClick={() => setMenuOpen(false)}>Sign Up</Link>
            </>
          )}
        </div>
      )}

      {}
      {profileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99 }}
          onClick={() => setProfileOpen(false)}
        />
      )}
    </nav>
  );
};

export default Navbar;
