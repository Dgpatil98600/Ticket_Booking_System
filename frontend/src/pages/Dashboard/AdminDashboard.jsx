
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../api/services';
import { useToast } from '../../context/ToastContext';
import { LuUsers, LuCalendar, LuMapPin, LuIndianRupee, LuTicket, LuSettings } from 'react-icons/lu';
import './Dashboard.css';

const AdminDashboard = () => {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await dashboardAPI.getAdminDashboard();
        setData(res.data.data);
      } catch {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return (
    <div className="loading-container" style={{ minHeight: '60vh' }}>
      <div className="spinner" /><p>Loading dashboard...</p>
    </div>
  );

  const { summary, usersByRole, recentUsers, recentBookings, monthlyRevenue, eventEarnings } = data || {};

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="dashboard-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p className="text-secondary">Platform overview and management</p>
          </div>
          <Link to="/admin/venues" className="btn btn-primary" id="manage-venues-btn">
            + Create Venue
          </Link>
        </div>

        {}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LuUsers /></div>
            <div className="stat-value gradient-text">{summary?.totalUsers || 0}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80' }}><LuCalendar /></div>
            <div className="stat-value" style={{ color: '#4ade80' }}>{summary?.totalEvents || 0}</div>
            <div className="stat-label">Events</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}><LuMapPin /></div>
            <div className="stat-value" style={{ color: '#fbbf24' }}>{summary?.totalVenues || 0}</div>
            <div className="stat-label">Venues</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}><LuIndianRupee /></div>
            <div className="stat-value" style={{ color: '#a78bfa' }}>₹{(summary?.totalRevenue || 0).toLocaleString('en-IN')}</div>
            <div className="stat-label">Total money of selled tickets</div>
          </div>
        </div>

        {}
        <div className="dashboard-row">
          <div className="dashboard-section half">
            <div className="section-header">
              <h2>Users by Role</h2>
              <button onClick={() => toast.info('User management coming soon')} className="btn btn-ghost btn-sm">Manage →</button>
            </div>
            <div className="role-breakdown">
              {[
                { role: 'customer', icon: <LuTicket />, color: '#22c55e' },
                { role: 'organizer', icon: <LuCalendar />, color: '#6c63ff' },
                { role: 'admin', icon: <LuSettings />, color: '#fbbf24' },
              ].map(({ role, icon, color }) => (
                <div key={role} className="role-item">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ display: 'flex', color }}>{icon}</span> {role.charAt(0).toUpperCase() + role.slice(1)}s
                  </span>
                  <span style={{ color, fontWeight: 700 }}>{usersByRole?.[role] || 0}</span>
                </div>
              ))}
            </div>
          </div>

          {}
          <div className="dashboard-section half">
            <div className="section-header"><h2>Monthly Revenue</h2></div>
            <div className="revenue-chart">
              {monthlyRevenue?.length === 0 ? (
                <p className="text-muted">No revenue data yet</p>
              ) : (
                monthlyRevenue?.map((m) => {
                  const maxRevenue = Math.max(...(monthlyRevenue?.map((r) => r.revenue) || [1]));
                  const pct = maxRevenue > 0 ? (m.revenue / maxRevenue) * 100 : 0;
                  const monthName = new Date(m._id.year, m._id.month - 1).toLocaleDateString('en-IN', { month: 'short' });
                  return (
                    <div key={`${m._id.year}-${m._id.month}`} className="rev-bar-item">
                      <div className="rev-bar-wrapper">
                        <div className="rev-bar-fill" style={{ height: `${pct}%` }} />
                      </div>
                      <span className="rev-bar-label">{monthName}</span>
                      <span className="rev-bar-value">₹{m.revenue.toLocaleString()}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Recent Users</h2>
            <button onClick={() => toast.info('User management coming soon')} className="btn btn-ghost btn-sm">View All →</button>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers?.map((u) => (
                  <tr key={u._id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td><span className="badge badge-primary">{u.role}</span></td>
                    <td>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Event-wise Earnings</h2>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Date</th>
                  <th>Bookings</th>
                  <th>Seats Booked</th>
                  <th>Remaining Seats</th>
                  <th>Total Earnings</th>
                </tr>
              </thead>
              <tbody>
                {eventEarnings?.length > 0 ? eventEarnings.map((e) => (
                  <tr key={e._id}>
                    <td><strong>{e.title}</strong></td>
                    <td>{new Date(e.date).toLocaleDateString('en-IN')}</td>
                    <td>{e.bookingsCount}</td>
                    <td>{e.seatsBooked || 0}</td>
                    <td>{e.availableSeats || 0}</td>
                    <td>₹{e.revenue?.toLocaleString('en-IN') || 0}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="text-muted text-center" style={{ padding: 'var(--space-lg)' }}>No event earnings yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {}
        <div className="dashboard-section">
          <h2>Quick Actions</h2>
          <div className="quick-links">
            <Link to="/admin/venues" id="venues-link" className="quick-link-card">
              <span>🏟️</span>
              <span>Manage Venues</span>
            </Link>
            <button onClick={() => toast.info('User management coming soon')} id="users-link" className="quick-link-card" style={{ background: 'none', border: '1px solid var(--border-subtle)', textAlign: 'left', cursor: 'pointer' }}>
              <span>👥</span>
              <span>Manage Users</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
