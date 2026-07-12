
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { bookingsAPI } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { LuTimer, LuCalendar, LuClock, LuMapPin, LuMail, LuCircleCheck } from 'react-icons/lu';
import './Checkout.css';

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const { eventId, seatIds, holdExpiresAt, event, selectedSeatDetails } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  // Redirect if no booking state
  useEffect(() => {
    if (!eventId || !seatIds?.length) {
      navigate('/');
    }
  }, [eventId, seatIds, navigate]);

  // Hold countdown timer
  useEffect(() => {
    if (!holdExpiresAt) return;
    const interval = setInterval(() => {
      const remaining = new Date(holdExpiresAt) - Date.now();
      if (remaining <= 0) {
        setTimeLeft('Expired');
        clearInterval(interval);
        toast.error('Seat hold expired. Please select seats again.');
        navigate(`/events/${eventId}`);
      } else {
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [holdExpiresAt, eventId, navigate, toast]);

  const totalAmount = selectedSeatDetails?.reduce((sum, s) => sum + s.price, 0) || 0;
  const convenienceFee = Math.round(totalAmount * 0.02);
  const finalAmount = totalAmount + convenienceFee;

  const handleConfirmBooking = async () => {
    setLoading(true);
    try {
      const { data } = await bookingsAPI.create({ eventId, seatIds });
      toast.success('Booking confirmed! Check your email for the QR ticket.');
      navigate(`/bookings/${data.data.booking._id}`, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Booking failed. Please try again.';
      toast.error(msg);
      if (err.response?.status === 409) {
        navigate(`/events/${eventId}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!event || !selectedSeatDetails) return null;

  return (
    <div className="checkout-page">
      <div className="container container-sm">
        <div className="checkout-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/events/${eventId}`)}>← Edit / Back to Event</button>
            <h1>Checkout</h1>
          </div>
          {timeLeft && timeLeft !== 'Expired' && (
            <div className={`checkout-timer ${parseInt(timeLeft) < 2 ? 'urgent' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <LuTimer /> Seats held for: <strong>{timeLeft}</strong>
            </div>
          )}
        </div>

        <div className="checkout-layout">
          {}
          <div className="checkout-summary">
            <div className="summary-card">
              <h2>Order Summary</h2>

              {}
              <div className="event-summary">
                <h3>{event.title}</h3>
                <div className="event-summary-meta">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><LuCalendar /> {new Date(event.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><LuClock /> {event.time}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><LuMapPin /> {event.venue?.name || 'Venue TBD'}</span>
                </div>
              </div>

              <div className="divider" />

              {}
              <div className="seats-list">
                <h4>Selected Seats</h4>
                {selectedSeatDetails.map((seat) => (
                  <div key={seat._id} className="seat-item">
                    <div>
                      <span className="seat-num">{seat.seatNumber}</span>
                      <span className={`seat-cat cat-${seat.category}`}>{seat.category}</span>
                    </div>
                    <span className="seat-price">₹{seat.price}</span>
                  </div>
                ))}
              </div>

              <div className="divider" />

              {}
              <div className="pricing-breakdown">
                <div className="price-line">
                  <span>Subtotal ({selectedSeatDetails.length} seat{selectedSeatDetails.length > 1 ? 's' : ''})</span>
                  <span>₹{totalAmount}</span>
                </div>
                <div className="price-line">
                  <span>Convenience Fee (2%)</span>
                  <span>₹{convenienceFee}</span>
                </div>
                <div className="price-line total">
                  <span>Total Amount</span>
                  <span>₹{finalAmount}</span>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="customer-card">
              <h4>Booking For</h4>
              <div className="customer-info">
                <div className="customer-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
                <div>
                  <p className="customer-name">{user?.name}</p>
                  <p className="customer-email">{user?.email}</p>
                </div>
              </div>
              <p className="email-notice" style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}><LuMail /> Confirmation & QR ticket will be sent to your email</p>
            </div>

            {}
            <button
              id="confirm-booking-btn"
              className="btn btn-primary btn-block btn-lg"
              onClick={handleConfirmBooking}
              disabled={loading || timeLeft === 'Expired'}
            >
              {loading ? (
                <><span className="spinner spinner-sm" /> Processing...</>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><LuCircleCheck /> Confirm Booking – ₹{finalAmount}</span>
              )}
            </button>

            <p className="checkout-disclaimer">
              By confirming, you agree to our terms. Cancellations may be made from your booking history.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
