import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { waitlistAPI } from '../../api/services';
import { useToast } from '../../context/ToastContext';
import { LuClock, LuCalendar, LuMapPin, LuTrash2 } from 'react-icons/lu';
import '../Bookings/Bookings.css'; 

const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const WaitlistHistory = () => {
  const toast = useToast();
  const [waitlists, setWaitlists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(null);

  useEffect(() => {
    const fetchWaitlists = async () => {
      try {
        const { data } = await waitlistAPI.getMyEntries();
        setWaitlists(data.data.entries || []);
      } catch {
        toast.error('Failed to load waitlists');
      } finally {
        setLoading(false);
      }
    };
    fetchWaitlists();
  }, []);

  const handleLeave = async (id) => {
    if (!window.confirm('Are you sure you want to leave this waitlist?')) return;
    setLeaving(id);
    try {
      await waitlistAPI.leave(id);
      setWaitlists(prev => prev.filter(w => w._id !== id));
      toast.success('Successfully removed from waitlist');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to leave waitlist');
    } finally {
      setLeaving(null);
    }
  };

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
        <p>Loading your waitlists...</p>
      </div>
    );
  }

  return (
    <div className="bookings-page">
      <div className="container">
        <h1 className="page-heading">My Waitlists</h1>

        {waitlists.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LuClock /></span>
            <h3>No Waitlists</h3>
            <p>You haven't joined any waitlists yet.</p>
            <Link to="/" className="btn btn-primary mt-md">Browse Events</Link>
          </div>
        ) : (
          <div className="bookings-list">
            {waitlists.map((entry) => (
              <div key={entry._id} className="booking-card confirmed">
                <div className="booking-card-header">
                  <div>
                    <h3 className="booking-event-title">
                      {entry.event?.title || 'Event'}
                    </h3>
                  </div>
                  <span className={`badge badge-primary`}>
                    Position #{entry.position}
                  </span>
                </div>

                <div className="booking-details">
                  <div className="booking-detail-item">
                    <span style={{ display: 'flex' }}><LuCalendar /></span>
                    <span>{entry.event?.date ? formatDate(entry.event.date) : '—'}</span>
                  </div>
                  <div className="booking-detail-item">
                    <span style={{ display: 'flex' }}><LuMapPin /></span>
                    <span>{entry.event?.venue?.name || '—'}</span>
                  </div>
                  <div className="booking-detail-item">
                    <span style={{ display: 'flex' }}><LuClock /></span>
                    <span>Category: {entry.category}</span>
                  </div>
                </div>

                <div className="booking-card-footer">
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleLeave(entry._id)}
                    disabled={leaving === entry._id}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <LuTrash2 /> {leaving === entry._id ? 'Leaving...' : 'Leave Waitlist'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WaitlistHistory;
