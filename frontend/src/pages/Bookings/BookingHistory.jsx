
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingsAPI } from '../../api/services';
import { useToast } from '../../context/ToastContext';
import { LuTicket, LuCalendar, LuClock, LuMapPin, LuIndianRupee, LuCalendarClock } from 'react-icons/lu';
import './Bookings.css';

const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const BookingHistory = () => {
  const toast = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const { data } = await bookingsAPI.getMyBookings();
        setBookings(data.data.bookings || []);
      } catch {
        toast.error('Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const handleCancel = async (bookingId, bookingRef) => {
    if (!window.confirm(`Cancel booking ${bookingRef}? This cannot be undone.`)) return;
    setCancelling(bookingId);
    try {
      await bookingsAPI.cancel(bookingId);
      setBookings((prev) =>
        prev.map((b) => b._id === bookingId ? { ...b, status: 'cancelled' } : b)
      );
      toast.success('Booking cancelled. Waitlisted customers will be notified.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setCancelling(null);
    }
  };

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
        <p>Loading your bookings...</p>
      </div>
    );
  }

  return (
    <div className="bookings-page">
      <div className="container">
        <h1 className="page-heading">My Bookings</h1>

        {bookings.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LuTicket /></span>
            <h3>No Bookings Yet</h3>
            <p>Browse events and book your first ticket!</p>
            <Link to="/" className="btn btn-primary mt-md">Browse Events</Link>
          </div>
        ) : (
          <div className="bookings-list">
            {bookings.map((booking) => (
              <div key={booking._id} className={`booking-card ${booking.status}`} id={`booking-${booking._id}`}>
                <div className="booking-card-header">
                  <div>
                    <h3 className="booking-event-title">
                      {booking.event?.title || 'Event'}
                    </h3>
                    <span className="booking-ref">#{booking.bookingRef}</span>
                  </div>
                  <span className={`badge ${booking.status === 'confirmed' ? 'badge-success' : 'badge-muted'}`}>
                    {booking.status}
                  </span>
                </div>

                <div className="booking-details">
                  <div className="booking-detail-item">
                    <span style={{ display: 'flex' }}><LuCalendar /></span>
                    <span>{booking.event?.date ? formatDate(booking.event.date) : '—'}</span>
                  </div>
                  <div className="booking-detail-item">
                    <span style={{ display: 'flex' }}><LuClock /></span>
                    <span>{booking.event?.time || '—'}</span>
                  </div>
                  <div className="booking-detail-item">
                    <span style={{ display: 'flex' }}><LuMapPin /></span>
                    <span>{booking.event?.venue?.name || '—'}</span>
                  </div>
                  <div className="booking-detail-item">
                    <span style={{ display: 'flex' }}><LuTicket /></span>
                    <span>{booking.seats?.map((s) => s.seatNumber).join(', ')}</span>
                  </div>
                  <div className="booking-detail-item">
                    <span style={{ display: 'flex' }}><LuIndianRupee /></span>
                    <span>₹{booking.finalAmount}</span>
                  </div>
                  <div className="booking-detail-item">
                    <span style={{ display: 'flex' }}><LuCalendarClock /></span>
                    <span>Booked on {formatDate(booking.createdAt)}</span>
                  </div>
                </div>

                <div className="booking-card-footer">
                  <Link to={`/bookings/${booking._id}`} className="btn btn-secondary btn-sm" id={`view-booking-${booking._id}`}>
                    View QR Ticket
                  </Link>
                  {booking.status === 'confirmed' && (
                    <button
                      id={`cancel-booking-${booking._id}`}
                      className="btn btn-danger btn-sm"
                      onClick={() => handleCancel(booking._id, booking.bookingRef)}
                      disabled={cancelling === booking._id}
                    >
                      {cancelling === booking._id ? 'Cancelling...' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingHistory;
