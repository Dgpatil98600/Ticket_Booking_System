
import { Link } from 'react-router-dom';
import { LuFilm, LuMusic, LuTrophy, LuStar, LuTicket, LuCalendar, LuClock, LuMapPin, LuBuilding, LuFlame } from 'react-icons/lu';
import './EventCard.css';

const EVENT_TYPE_ICONS = {
  movie: <LuFilm />,
  concert: <LuMusic />,
  sports: <LuTrophy />,
  theater: <LuStar />,
  other: <LuTicket />,
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const EventCard = ({ event }) => {
  const icon = EVENT_TYPE_ICONS[event.type] || <LuTicket />;
  const minPrice = Math.min(
    event.pricing?.premium || Infinity,
    event.pricing?.standard || Infinity,
    event.pricing?.economy || Infinity
  );

  const occupancy = event.totalSeats > 0
    ? Math.round((event.bookedSeats / event.totalSeats) * 100)
    : 0;

  const isAlmostFull = occupancy >= 80;
  const isSoldOut = event.availableSeats === 0;

  return (
    <Link to={`/events/${event._id}`} className="event-card" id={`event-${event._id}`}>
      {}
      <div className="event-card-banner">
        {event.imageUrl ? (
          <img src={event.imageUrl} alt={event.title} className="event-banner-img" />
        ) : (
          <div className="event-banner-placeholder">
            <span className="banner-icon">{icon}</span>
            <div className="banner-glow" />
          </div>
        )}
        <div className="event-type-badge" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {icon} {event.type}
        </div>
        {isSoldOut && <div className="sold-out-overlay">SOLD OUT</div>}
        {isAlmostFull && !isSoldOut && (
          <div className="almost-full-badge" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <LuFlame /> Almost Full
          </div>
        )}
      </div>

      {}
      <div className="event-card-body">
        <h3 className="event-title">{event.title}</h3>

        <div className="event-meta">
          <div className="meta-item">
            <span style={{ display: 'flex' }}><LuCalendar /></span>
            <span>{formatDate(event.date)}</span>
          </div>
          <div className="meta-item">
            <span style={{ display: 'flex' }}><LuClock /></span>
            <span>{event.time}</span>
          </div>
          {event.venue && (
            <div className="meta-item">
              <span style={{ display: 'flex' }}><LuMapPin /></span>
              <span>{event.venue.name}</span>
            </div>
          )}
          {event.venue?.address?.city && (
            <div className="meta-item">
              <span style={{ display: 'flex' }}><LuBuilding /></span>
              <span>{event.venue.address.city}</span>
            </div>
          )}
        </div>

        {}
        <div className="occupancy-bar">
          <div
            className="occupancy-fill"
            style={{
              width: `${occupancy}%`,
              background: occupancy >= 80
                ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                : 'linear-gradient(90deg, #22c55e, #16a34a)',
            }}
          />
        </div>
        <div className="occupancy-label">
          <span>{event.availableSeats} seats left</span>
          <span>{occupancy}% booked</span>
        </div>

        {}
        <div className="event-footer">
          <div className="price-info">
            <span className="price-from">From</span>
            <span className="price-amount">₹{minPrice === Infinity ? 'TBD' : minPrice}</span>
          </div>
          <div className="book-cta">
            {isSoldOut ? 'Join Waitlist' : 'Book Now'} →
          </div>
        </div>
      </div>
    </Link>
  );
};

export default EventCard;
