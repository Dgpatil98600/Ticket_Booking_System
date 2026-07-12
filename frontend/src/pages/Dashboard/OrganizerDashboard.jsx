
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../api/services';
import { useToast } from '../../context/ToastContext';
import { LuCalendar, LuCircleCheck, LuTicket, LuIndianRupee } from 'react-icons/lu';
import './Dashboard.css';

const OrganizerDashboard = () => {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await dashboardAPI.getOrganizerDashboard();
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

  const { summary, events, recentBookings } = data || {};

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="dashboard-header">
          <div>
            <h1>Organizer Dashboard</h1>
            <p className="text-secondary">Manage your events and track bookings</p>
          </div>
          <Link to="/organizer/events/new" id="create-event-btn" className="btn btn-primary">
            + Create Event
          </Link>
        </div>

        {}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LuCalendar /></div>
            <div className="stat-value gradient-text">{summary?.totalEvents || 0}</div>
            <div className="stat-label">Total Events</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80' }}><LuCircleCheck /></div>
            <div className="stat-value" style={{ color: '#4ade80' }}>{summary?.publishedEvents || 0}</div>
            <div className="stat-label">Published</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}><LuTicket /></div>
            <div className="stat-value" style={{ color: '#fbbf24' }}>{summary?.totalBookings || 0}</div>
            <div className="stat-label">Total Bookings</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}><LuIndianRupee /></div>
            <div className="stat-value" style={{ color: '#a78bfa' }}>₹{(summary?.totalRevenue || 0).toLocaleString('en-IN')}</div>
            <div className="stat-label">Total Revenue</div>
          </div>
        </div>

        {}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Your Events</h2>
            <button onClick={() => toast.info('View all events coming soon')} className="btn btn-ghost btn-sm">View All →</button>
          </div>

          {events?.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LuCalendar /></span>
              <h3>No Events Yet</h3>
              <p>Create your first event to start accepting bookings.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Bookings</th>
                    <th>Seats Booked</th>
                    <th>Remaining Seats</th>
                    <th>Occupancy</th>
                    <th>Revenue</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events?.map((event) => (
                    <tr key={event._id} id={`event-row-${event._id}`}>
                      <td>
                        <div className="event-cell">
                          <strong>{event.title}</strong>
                          <span>{event.venue?.name}</span>
                        </div>
                      </td>
                      <td>{new Date(event.date).toLocaleDateString('en-IN')}</td>
                      <td>
                        <span className={`badge ${event.status === 'published' ? 'badge-success' : event.status === 'cancelled' ? 'badge-error' : 'badge-muted'}`}>
                          {event.status}
                        </span>
                      </td>
                      <td>{event.bookingsCount || 0}</td>
                      <td>{event.bookedSeats || 0}</td>
                      <td>{event.availableSeats || 0}</td>
                      <td>
                        <div className="occupancy-cell">
                          <div className="mini-bar">
                            <div className="mini-fill" style={{ width: `${event.occupancy}%` }} />
                          </div>
                          <span>{event.occupancy}%</span>
                        </div>
                      </td>
                      <td>₹{event.revenue?.toLocaleString('en-IN') || 0}</td>
                      <td>
                        <div className="action-btns">
                          <Link to={`/events/${event._id}`} className="btn btn-ghost btn-sm">View</Link>
                          <Link to={`/organizer/events/${event._id}/edit`} className="btn btn-secondary btn-sm">Edit</Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Recent Bookings</h2>
          </div>
          {recentBookings?.length === 0 ? (
            <p className="text-muted">No bookings yet.</p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Ref</th>
                    <th>Customer</th>
                    <th>Event</th>
                    <th>Seats Booked</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings?.map((b) => (
                    <tr key={b._id}>
                      <td><span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{b.bookingRef}</span></td>
                      <td>{b.user?.name}</td>
                      <td>{b.event?.title}</td>
                      <td>{b.seats?.length || 0}</td>
                      <td>₹{b.finalAmount}</td>
                      <td>{new Date(b.createdAt).toLocaleDateString('en-IN')}</td>
                      <td><span className={`badge ${b.status === 'confirmed' ? 'badge-success' : 'badge-muted'}`}>{b.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrganizerDashboard;
