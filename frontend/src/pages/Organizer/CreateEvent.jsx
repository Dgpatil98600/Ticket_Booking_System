
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { eventsAPI, venuesAPI } from '../../api/services';
import { useToast } from '../../context/ToastContext';
import { LuStar, LuTicket } from 'react-icons/lu';
import '../Admin/AdminPages.css';

const generateRowLabels = (count) => {
  const labels = [];
  for (let i = 0; i < count; i++) {
    let label = '';
    let n = i;
    do {
      label = String.fromCharCode(65 + (n % 26)) + label;
      n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    labels.push(label);
  }
  return labels;
};

const CreateEvent = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const toast = useToast();
  const [venues, setVenues] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditMode);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: {
      type: 'movie',
      status: 'draft',
      pricing: { premium: 500, standard: 300, economy: 200 },
    }
  });

  const selectedVenueId = watch('venue');
  const selectedVenueData = venues.find(v => v._id === selectedVenueId);

  let activeRows = [];
  if (selectedVenueData) {
    activeRows = generateRowLabels(selectedVenueData.totalRows || 0);
  }

  const hasPremium = selectedVenueData?.categories?.some(c => c.name === 'premium' && c.rows?.some(r => activeRows.includes(r.toUpperCase())));
  const hasStandard = selectedVenueData?.categories?.some(c => c.name === 'standard' && c.rows?.some(r => activeRows.includes(r.toUpperCase())));
  const hasEconomy = selectedVenueData?.categories?.some(c => c.name === 'economy' && c.rows?.some(r => activeRows.includes(r.toUpperCase())));

  useEffect(() => {
    venuesAPI.getAll().then(({ data }) => setVenues(data.data.venues || []));

    if (isEditMode) {
      eventsAPI.getById(id).then(({ data }) => {
        const event = data.data.event;
        reset({
          title: event.title,
          type: event.type,
          venue: event.venue._id,
          date: new Date(event.date).toISOString().split('T')[0],
          time: event.time,
          description: event.description || '',
          imageUrl: event.imageUrl || '',
          status: event.status,
          pricing: {
            premium: event.pricing?.premium || 0,
            standard: event.pricing?.standard || 0,
            economy: event.pricing?.economy || 0,
          }
        });
        setLoading(false);
      }).catch((err) => {
        toast.error('Failed to load event details');
        navigate('/organizer/dashboard');
      });
    }
  }, [id, isEditMode, reset, navigate, toast]);

  const onSubmit = async (formData) => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        pricing: {
          premium: Number(formData.pricing.premium) || 0,
          standard: Number(formData.pricing.standard) || 0,
          economy: Number(formData.pricing.economy) || 0,
        },
      };
      
      if (isEditMode) {
        await eventsAPI.update(id, payload);
        toast.success('Event updated successfully!');
      } else {
        await eventsAPI.create(payload);
        toast.success('Event created successfully!');
      }
      navigate('/organizer/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} event`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="admin-page"><div className="container container-sm"><p>Loading event details...</p></div></div>;
  }

  return (
    <div className="admin-page">
      <div className="container container-sm">
        <h1 style={{ marginBottom: 'var(--space-xl)' }}>{isEditMode ? 'Edit Event' : 'Create New Event'}</h1>

        <div className="admin-form-card">
          <form onSubmit={handleSubmit(onSubmit)} id="create-event-form">
            <div className="form-group">
              <label className="form-label">Event Title *</label>
              <input id="event-title" type="text" className={`form-input ${errors.title ? 'error' : ''}`}
                placeholder="e.g. Coldplay: Music of the Spheres World Tour"
                {...register('title', { required: 'Title is required' })} />
              {errors.title && <span className="form-error">{errors.title.message}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Event Type *</label>
                <select id="event-type" className="form-input form-select" {...register('type', { required: true })}>
                  <option value="movie">Movie</option>
                  <option value="concert">Concert</option>
                  <option value="sports">Sports</option>
                  <option value="theater">Theater</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Venue *</label>
                <select id="event-venue" className={`form-input form-select ${errors.venue ? 'error' : ''}`}
                  {...register('venue', { required: 'Venue is required' })} disabled={isEditMode}>
                  <option value="">Select Venue</option>
                  {venues.map((v) => (
                    <option key={v._id} value={v._id}>{v.name} – {v.address?.city} ({v.totalCapacity} seats)</option>
                  ))}
                </select>
                {errors.venue && <span className="form-error">{errors.venue.message}</span>}
                {isEditMode && <small className="text-muted text-sm mt-xs">Venue cannot be changed after creation.</small>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input id="event-date" type="date" className={`form-input ${errors.date ? 'error' : ''}`}
                  {...register('date', { required: 'Date is required' })} />
                {errors.date && <span className="form-error">{errors.date.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Time *</label>
                <input id="event-time" type="time" className={`form-input ${errors.time ? 'error' : ''}`}
                  {...register('time', { required: 'Time is required' })} />
                {errors.time && <span className="form-error">{errors.time.message}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea id="event-description" className="form-input" rows={3}
                placeholder="Describe your event..."
                {...register('description')} style={{ resize: 'vertical' }} />
            </div>

            {}
            <div className="form-group">
              <label className="form-label">Ticket Pricing (₹)</label>
              <div className="categories-grid">
                <div className={`category-input cat-premium ${!hasPremium && selectedVenueId ? 'disabled' : ''}`} style={{ opacity: (!hasPremium && selectedVenueId) ? 0.5 : 1 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><LuStar /> Premium {(!hasPremium && selectedVenueId) && <small>(N/A)</small>}</label>
                  <input id="price-premium" type="number" className="form-input" min={0}
                    {...register('pricing.premium', { min: 0, valueAsNumber: true })} disabled={!hasPremium && selectedVenueId} />
                </div>
                <div className={`category-input cat-standard ${!hasStandard && selectedVenueId ? 'disabled' : ''}`} style={{ opacity: (!hasStandard && selectedVenueId) ? 0.5 : 1 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><LuTicket /> Standard {(!hasStandard && selectedVenueId) && <small>(N/A)</small>}</label>
                  <input id="price-standard" type="number" className="form-input" min={0}
                    {...register('pricing.standard', { min: 0, valueAsNumber: true })} disabled={!hasStandard && selectedVenueId} />
                </div>
                <div className={`category-input cat-economy ${!hasEconomy && selectedVenueId ? 'disabled' : ''}`} style={{ opacity: (!hasEconomy && selectedVenueId) ? 0.5 : 1 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><LuTicket /> Economy {(!hasEconomy && selectedVenueId) && <small>(N/A)</small>}</label>
                  <input id="price-economy" type="number" className="form-input" min={0}
                    {...register('pricing.economy', { min: 0, valueAsNumber: true })} disabled={!hasEconomy && selectedVenueId} />
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Image URL (optional)</label>
                <input id="event-image" type="url" className="form-input" placeholder="https://..."
                  {...register('imageUrl')} />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select id="event-status" className="form-input form-select" {...register('status')}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            <div className="flex gap-md">
              <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
              <button type="submit" id="submit-event-btn" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : isEditMode ? 'Update Event' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;
