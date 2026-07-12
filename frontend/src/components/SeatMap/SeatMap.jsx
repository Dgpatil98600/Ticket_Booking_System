
import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import './SeatMap.css';

const CATEGORY_COLORS = {
  premium: '#fbbf24',
  standard: '#6c63ff',
  economy: '#22c55e',
};

const SeatMap = ({
  seats = [],
  eventId,
  selectedSeats = [],
  onSeatToggle,
  onSeatRelease,
  maxSeats = 10,
  holdExpiresAt = null,
  myHeldSeats = [],
  disabled = false,
}) => {
  const { joinEventRoom, leaveEventRoom, on, off } = useSocket();
  const { user } = useAuth();
  const [seatStatuses, setSeatStatuses] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    const statusMap = {};
    seats.forEach((seat) => {
      statusMap[seat._id] = seat.status;
    });
    setSeatStatuses(statusMap);
  }, [seats]);

  useEffect(() => {
    if (!eventId) return;

    joinEventRoom(eventId);

    const handleSeatHeld = ({ seatId }) => {
      setSeatStatuses((prev) => ({ ...prev, [seatId]: 'held' }));
    };

    const handleSeatReleased = ({ seatId }) => {
      setSeatStatuses((prev) => ({ ...prev, [seatId]: 'available' }));
    };

    const handleSeatBooked = ({ seatId }) => {
      setSeatStatuses((prev) => ({ ...prev, [seatId]: 'booked' }));
    };

    on('seat:held', handleSeatHeld);
    on('seat:released', handleSeatReleased);
    on('seat:booked', handleSeatBooked);

    return () => {
      leaveEventRoom(eventId);
      off('seat:held', handleSeatHeld);
      off('seat:released', handleSeatReleased);
      off('seat:booked', handleSeatBooked);
    };
  }, [eventId, joinEventRoom, leaveEventRoom, on, off]);

  useEffect(() => {
    if (!holdExpiresAt) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const remaining = new Date(holdExpiresAt) - Date.now();
      if (remaining <= 0) {
        setTimeLeft(0);
        return;
      }
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [holdExpiresAt]);

  const rows = {};
  seats.forEach((seat) => {
    if (!rows[seat.row]) rows[seat.row] = [];
    rows[seat.row].push(seat);
  });

  const sortedRows = Object.keys(rows).sort();
  const maxCols = Math.max(...Object.values(rows).map((r) => r.length));

  const getSeatState = useCallback((seat) => {
    const isSelected = selectedSeats.includes(seat._id);
    const isMyHeld = myHeldSeats.includes(seat._id);
    const liveStatus = seatStatuses[seat._id] || seat.status;

    if (isSelected) return 'selected';
    if (isMyHeld) return 'my-held';
    return liveStatus;
  }, [selectedSeats, myHeldSeats, seatStatuses]);

  const handleSeatClick = (seat) => {
    if (disabled) return;
    const state = getSeatState(seat);
    if (state === 'booked' || state === 'held') return;
    if (state === 'my-held') {
      onSeatRelease?.(seat);
      return;
    }
    if (state === 'selected') {
      onSeatToggle?.(seat, false); 
      return;
    }
    if (selectedSeats.length >= maxSeats) {
      toast.error(`You can only select up to ${maxSeats} seats per booking.`);
      return; 
    }
    onSeatToggle?.(seat, true); 
  };

  const totalCols = maxCols || 10;

  return (
    <div className="seatmap-wrapper">
      {}
      {holdExpiresAt && timeLeft !== null && (
        <div className={`hold-timer ${timeLeft === 0 ? 'expired' : parseInt(timeLeft) < 2 ? 'urgent' : ''}`}>
          <span>⏱️</span>
          <span>
            {timeLeft === 0
              ? 'Hold expired! Please refresh.'
              : `Seat hold expires in: ${timeLeft}`}
          </span>
        </div>
      )}

      {}
      <div className="screen-container">
        <div className="screen">
          <span>SCREEN</span>
        </div>
        <div className="screen-glow" />
      </div>

      {}
      <div className="seatmap-perspective">
        <div className="seatmap-grid">
          {sortedRows.map((rowLabel) => {
            const rowSeats = rows[rowLabel].sort((a, b) => a.col - b.col);
            const category = rowSeats[0]?.category;

            return (
              <div key={rowLabel} className="seat-row">
                {}
                <span className="row-label">{rowLabel}</span>

                {}
                <div className="row-seats" style={{ '--total-cols': totalCols }}>
                  {rowSeats.map((seat) => {
                    const state = getSeatState(seat);
                    const catColor = CATEGORY_COLORS[seat.category] || '#6c63ff';

                    return (
                      <button
                        key={seat._id}
                        id={`seat-${seat._id}`}
                        className={`seat seat-${state}`}
                        onClick={() => handleSeatClick(seat)}
                        disabled={state === 'booked' || state === 'held' || disabled}
                        style={{
                          '--seat-color': catColor,
                        }}
                        title={`${seat.seatNumber} · ${seat.category} · ₹${seat.price}`}
                        aria-label={`Seat ${seat.seatNumber}, ${state}`}
                      >
                        <span className="seat-number">{seat.col}</span>
                      </button>
                    );
                  })}
                </div>

                {}
                <span className="row-label row-label-right">{rowLabel}</span>
              </div>
            );
          })}
        </div>
      </div>

      {}
      <div className="seat-legend">
        <div className="legend-item">
          <div className="legend-dot seat-available-demo" />
          <span>Available</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot seat-selected-demo" />
          <span>Selected</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot seat-held-demo" />
          <span>On Hold</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot seat-booked-demo" />
          <span>Booked</span>
        </div>
      </div>

      {}
      <div className="category-legend">
        <span className="cat-legend-label">Categories:</span>
        {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
          <div key={cat} className="cat-legend-item" style={{ '--cat-color': color }}>
            <div className="cat-dot" />
            <span className="capitalize">{cat}</span>
          </div>
        ))}
      </div>

      {}
      {selectedSeats.length > 0 && (
        <div className="selection-info">
          <span>Selected: <strong>{selectedSeats.length}</strong></span>
          {maxSeats > 0 && <span>Max: <strong>{maxSeats}</strong></span>}
        </div>
      )}
    </div>
  );
};

export default SeatMap;
