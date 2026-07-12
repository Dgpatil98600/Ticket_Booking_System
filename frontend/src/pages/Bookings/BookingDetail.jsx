
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { bookingsAPI } from '../../api/services';
import { LuCircleCheck, LuCircleX } from 'react-icons/lu';
import './Bookings.css';

const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const BookingDetail = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const { data } = await bookingsAPI.getById(id);
        setBooking(data.data.booking);
      } catch (err) {
        setError(err.response?.data?.message || 'Booking not found');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

  if (loading) return (
    <div className="loading-container" style={{ minHeight: '60vh' }}>
      <div className="spinner" /><p>Loading booking...</p>
    </div>
  );

  if (error) return (
    <div className="container mt-lg">
      <div className="alert alert-error">{error}</div>
      <Link to="/bookings" className="btn btn-secondary mt-md">← My Bookings</Link>
    </div>
  );

  return (
    <div className="booking-detail-page">
      <div className="container container-sm">
        <div className={`booking-detail-card ${booking.status}`}>
          {}
          <div className={`booking-status-header ${booking.status}`}>
            <span className="status-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {booking.status === 'confirmed' ? <LuCircleCheck /> : <LuCircleX />}
            </span>
            <div>
              <h2>{booking.status === 'confirmed' ? 'Booking Confirmed!' : 'Booking Cancelled'}</h2>
              <p className="booking-ref-display">#{booking.bookingRef}</p>
            </div>
          </div>

          {}
          {booking.status === 'confirmed' && booking.qrCode && (
            <div className="qr-section">
              <p className="qr-label">Show this at venue entrance</p>
              <div className="qr-wrapper">
                <img src={booking.qrCode} alt="QR Code" className="qr-image" />
              </div>
              <p className="qr-ref">{booking.bookingRef}</p>
            </div>
          )}

          {}
          <div className="booking-info-grid">
            <div className="info-block">
              <span className="info-label">Event</span>
              <span className="info-value">{booking.event?.title}</span>
            </div>
            <div className="info-block">
              <span className="info-label">Date</span>
              <span className="info-value">{booking.event?.date ? formatDate(booking.event.date) : '—'}</span>
            </div>
            <div className="info-block">
              <span className="info-label">Time</span>
              <span className="info-value">{booking.event?.time || '—'}</span>
            </div>
            <div className="info-block">
              <span className="info-label">Venue</span>
              <span className="info-value">{booking.event?.venue?.name || '—'}</span>
            </div>
          </div>

          {}
          <div className="booked-seats">
            <h4>Your Seats</h4>
            <div className="seats-grid">
              {booking.seats?.map((s) => (
                <div key={s._id || s.seatNumber} className={`booked-seat-chip cat-${s.category}`}>
                  <strong>{s.seatNumber}</strong>
                  <span>{s.category}</span>
                  <span>₹{s.price}</span>
                </div>
              ))}
            </div>
          </div>

          {}
          <div className="booking-totals">
            <div className="total-row"><span>Subtotal</span><span>₹{booking.totalAmount}</span></div>
            <div className="total-row"><span>Convenience Fee</span><span>₹{booking.convenienceFee}</span></div>
            <div className="total-row final"><span>Total Paid</span><span>₹{booking.finalAmount}</span></div>
          </div>

          <div className="booking-actions">
            <Link to="/bookings" className="btn btn-secondary">← My Bookings</Link>
            <Link to="/" className="btn btn-primary">Browse Events</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetail;
