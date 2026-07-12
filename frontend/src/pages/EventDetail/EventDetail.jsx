
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { eventsAPI, seatsAPI, waitlistAPI } from '../../api/services';
import SeatMap from '../../components/SeatMap/SeatMap';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { LuFilm, LuMusic, LuTicket, LuCalendar, LuClock, LuMapPin, LuBuilding, LuListMusic, LuStar, LuBan } from 'react-icons/lu';
import './EventDetail.css';

const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
});

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  
  const isCustomer = !isAuthenticated || user?.role === 'customer';

  const [event, setEvent] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [myHeldSeats, setMyHeldSeats] = useState([]);
  const [holdExpiresAt, setHoldExpiresAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [holding, setHolding] = useState(false);
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      try {
        const [eventRes, seatsRes] = await Promise.all([
          eventsAPI.getById(id),
          seatsAPI.getEventSeats(id),
        ]);
        setEvent(eventRes.data.data.event);
        const fetchedSeats = seatsRes.data.data.seats || [];
        setSeats(fetchedSeats);
        
        if (user?._id) {
          const myHeld = fetchedSeats.filter(s => s.status === 'held' && s.heldBy === user._id);
          if (myHeld.length > 0) {
            setMyHeldSeats(myHeld.map(s => s._id));
            const minExpiry = Math.min(...myHeld.map(s => new Date(s.holdExpiresAt).getTime()));
            if (minExpiry) setHoldExpiresAt(new Date(minExpiry));
          }
        }
      } catch (err) {
        setError('Event not found or failed to load.');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handleSeatToggle = (seat, select) => {
    if (select) {
      setSelectedSeats((prev) => [...prev, seat._id]);
    } else {
      setSelectedSeats((prev) => prev.filter((s) => s !== seat._id));
    }
  };

  const handleHoldSeats = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/events/${id}` } });
      return;
    }
    if (selectedSeats.length === 0) {
      toast.warning('Please select at least one seat');
      return;
    }

    setHolding(true);
    try {
      const { data } = await seatsAPI.holdSeats({ eventId: id, seatIds: selectedSeats });
      const heldIds = data.data.seats.map((s) => s._id);
      setMyHeldSeats(heldIds);
      setHoldExpiresAt(data.data.holdExpiresAt);
      setSelectedSeats([]);
      toast.success(`${heldIds.length} seat(s) held! Proceed to checkout.`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to hold seats. Try again.';
      toast.error(msg);
    } finally {
      setHolding(false);
    }
  };

  const handleSeatRelease = async (seat) => {
    try {
      await seatsAPI.releaseSeats({ eventId: id, seatIds: [seat._id] });
      setMyHeldSeats((prev) => {
        const newHeld = prev.filter((sId) => sId !== seat._id);
        if (newHeld.length === 0) setHoldExpiresAt(null);
        return newHeld;
      });
      toast.success(`Released seat ${seat.seatNumber}`);
    } catch (err) {
      toast.error('Failed to release seat');
    }
  };

  const handleCancelAllHolds = async () => {
    if (!myHeldSeats.length) return;
    try {
      await seatsAPI.releaseSeats({ eventId: id, seatIds: myHeldSeats });
      setMyHeldSeats([]);
      setHoldExpiresAt(null);
      toast.success('All held seats released');
    } catch (err) {
      toast.error('Failed to release all seats');
    }
  };

  const handleProceedToCheckout = () => {
    navigate('/checkout', {
      state: {
        eventId: id,
        seatIds: myHeldSeats,
        holdExpiresAt,
        event,
        selectedSeatDetails: seats.filter((s) => myHeldSeats.includes(s._id)),
      },
    });
  };

  const handleJoinWaitlist = async (category) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/events/${id}` } });
      return;
    }
    setJoiningWaitlist(true);
    try {
      const { data } = await waitlistAPI.join({ eventId: id, category });
      toast.success(`Added to ${category} waitlist at position ${data.data.entry.position}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to join waitlist';
      toast.error(msg);
    } finally {
      setJoiningWaitlist(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
        <p>Loading event details...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container mt-lg">
        <div className="alert alert-error">{error || 'Event not found'}</div>
        <Link to="/" className="btn btn-secondary mt-md">← Back to Events</Link>
      </div>
    );
  }

  const isSoldOut = event.availableSeats === 0;
  const minPrice = Math.min(
    event.pricing?.premium || Infinity,
    event.pricing?.standard || Infinity,
    event.pricing?.economy || Infinity,
  );

  const selectedSeatDetails = seats.filter((s) => myHeldSeats.length > 0
    ? myHeldSeats.includes(s._id)
    : selectedSeats.includes(s._id)
  );
  const selectedTotal = selectedSeatDetails.reduce((sum, s) => sum + s.price, 0);

  return (
    <div className="event-detail-page">
      {}
      <div className="event-detail-banner">
        {event.bannerUrl || event.imageUrl ? (
          <img src={event.bannerUrl || event.imageUrl} alt={event.title} className="banner-img" />
        ) : (
          <div className="banner-gradient" />
        )}
        <div className="banner-overlay" />
        <div className="container banner-content">
          <div className="event-type-pill" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {event.type === 'movie' ? <LuFilm /> : event.type === 'concert' ? <LuMusic /> : <LuTicket />} {event.type}
          </div>
          <h1 className="event-detail-title">{event.title}</h1>
          <div className="event-detail-meta">
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><LuCalendar /> {formatDate(event.date)}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><LuClock /> {event.time}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><LuMapPin /> {event.venue?.name}</span>
            {event.venue?.address?.city && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><LuBuilding /> {event.venue.address.city}</span>}
          </div>
        </div>
      </div>

      <div className="container event-detail-body">
        <div className="event-detail-layout">
          {}
          <div className="seatmap-section">
            <h2 className="section-title">Select Your Seats</h2>

            {isSoldOut ? (
              <div className="sold-out-section">
                <div className="alert alert-warning">
                  <span style={{ display: 'flex', fontSize: '1.5rem', marginRight: '8px' }}><LuListMusic /></span>
                  <div>
                    <strong>Event is Sold Out!</strong>
                    <p>Join the waitlist and we'll notify you if seats become available.</p>
                  </div>
                </div>
                <div className="waitlist-options">
                  {['premium', 'standard', 'economy'].map((cat) => (
                    event.pricing?.[cat] > 0 && (
                      <button
                        key={cat}
                        id={`join-waitlist-${cat}`}
                        className="btn btn-secondary"
                        onClick={() => handleJoinWaitlist(cat)}
                        disabled={joiningWaitlist || !isAuthenticated}
                      >
                        Join {cat.charAt(0).toUpperCase() + cat.slice(1)} Waitlist (₹{event.pricing[cat]})
                      </button>
                    )
                  ))}
                </div>
              </div>
            ) : (
              <SeatMap
                seats={seats}
                eventId={id}
                selectedSeats={selectedSeats}
                onSeatToggle={handleSeatToggle}
                onSeatRelease={handleSeatRelease}
                myHeldSeats={myHeldSeats}
                holdExpiresAt={holdExpiresAt}
                maxSeats={10}
                disabled={!isCustomer}
              />
            )}
          </div>

          {}
          <div className="booking-panel">
            {}
            <div className="pricing-card">
              <h3>Ticket Prices</h3>
              <div className="pricing-grid">
                {event.pricing?.premium > 0 && (
                  <div className="price-row premium">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><LuStar /> Premium</span>
                    <span>₹{event.pricing.premium}</span>
                  </div>
                )}
                {event.pricing?.standard > 0 && (
                  <div className="price-row standard">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><LuTicket /> Standard</span>
                    <span>₹{event.pricing.standard}</span>
                  </div>
                )}
                {event.pricing?.economy > 0 && (
                  <div className="price-row economy">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><LuTicket /> Economy</span>
                    <span>₹{event.pricing.economy}</span>
                  </div>
                )}
              </div>
            </div>

            {!isCustomer && (
              <div className="alert-box" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-error)', color: '#fca5a5', padding: '15px', borderRadius: '8px', marginTop: '20px', textAlign: 'center' }}>
                <span style={{ fontSize: '1.2rem', display: 'flex', justifyContent: 'center', marginBottom: '8px' }}><LuBan /></span>
                <strong>Admins and Organizers cannot book tickets.</strong>
                <p style={{ fontSize: '0.85rem', marginTop: '5px', opacity: 0.8 }}>Please log in as a normal user to book seats.</p>
              </div>
            )}

            {}
            {isCustomer && (selectedSeats.length > 0 || myHeldSeats.length > 0) && (
              <div className="selection-summary">
                <h4>Your Selection</h4>
                {selectedSeatDetails.map((s) => (
                  <div key={s._id} className="selection-row">
                    <span>{s.seatNumber} ({s.category})</span>
                    <span>₹{s.price}</span>
                  </div>
                ))}
                <div className="selection-total">
                  <span>Subtotal</span>
                  <span>₹{selectedTotal}</span>
                </div>

                {myHeldSeats.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'var(--space-md)' }}>
                    <button
                      id="proceed-checkout-btn"
                      className="btn btn-primary btn-block"
                      onClick={handleProceedToCheckout}
                    >
                      Proceed to Checkout →
                    </button>
                    <button
                      id="cancel-holds-btn"
                      className="btn btn-secondary btn-block"
                      onClick={handleCancelAllHolds}
                    >
                      Cancel All Held Seats
                    </button>
                  </div>
                ) : (
                  <button
                    id="hold-seats-btn"
                    className="btn btn-primary btn-block mt-md"
                    onClick={handleHoldSeats}
                    disabled={holding || selectedSeats.length === 0}
                  >
                    {holding ? (
                      <><span className="spinner spinner-sm" /> Holding Seats...</>
                    ) : (
                      `Hold ${selectedSeats.length} Seat(s) – ₹${selectedTotal}`
                    )}
                  </button>
                )}

                {!isAuthenticated && (
                  <p className="text-muted text-sm text-center mt-sm">
                    <Link to="/login" style={{ color: 'var(--color-primary-light)' }}>Login</Link> to book seats
                  </p>
                )}
              </div>
            )}

            {}
            {event.description && (
              <div className="event-description">
                <h4>About the Event</h4>
                <p>{event.description}</p>
              </div>
            )}

            {}
            {event.venue && (
              <div className="venue-info">
                <h4>Venue</h4>
                <p className="venue-name">{event.venue.name}</p>
                {event.venue.address && (
                  <p className="venue-address">
                    {[event.venue.address.street, event.venue.address.city, event.venue.address.state].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
