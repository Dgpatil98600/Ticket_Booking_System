
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { waitlistAPI } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { LuClock, LuCircleCheck } from 'react-icons/lu';

const WaitlistClaim = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/login?from=/waitlist/claim/${token}`);
      return;
    }

    const claim = async () => {
      try {
        const { data } = await waitlistAPI.claimOffer(token);
        setResult(data.data);
        toast.success('Seat held! Proceed to checkout within 10 minutes.');

        // Auto-redirect to event page for checkout
        setTimeout(() => {
          navigate(`/events/${data.data.eventId}`);
        }, 3000);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to claim offer');
      } finally {
        setLoading(false);
      }
    };

    claim();
  }, [token, isAuthenticated]);

  if (loading) return (
    <div className="loading-container" style={{ minHeight: '80vh' }}>
      <div className="spinner" />
      <p>Claiming your seat...</p>
    </div>
  );

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-lg)' }}>
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        {error ? (
          <div>
            <span style={{ fontSize: '4rem', display: 'flex', justifyContent: 'center' }}><LuClock /></span>
            <h2 style={{ marginTop: 'var(--space-md)' }}>Offer Expired</h2>
            <p className="text-secondary" style={{ margin: 'var(--space-md) 0 var(--space-xl)' }}>{error}</p>
            <Link to="/" className="btn btn-primary">Browse Events</Link>
          </div>
        ) : (
          <div>
            <span style={{ fontSize: '4rem', display: 'flex', justifyContent: 'center' }}><LuCircleCheck /></span>
            <h2 style={{ marginTop: 'var(--space-md)' }}>Seat Claimed!</h2>
            <p className="text-secondary" style={{ margin: 'var(--space-md) 0 var(--space-xl)' }}>
              Your seat has been held. Redirecting to checkout in 3 seconds...
            </p>
            <Link to={`/events/${result?.eventId}`} className="btn btn-primary">
              Go to Checkout →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default WaitlistClaim;
