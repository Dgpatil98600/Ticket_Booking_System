
import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { venuesAPI } from '../../api/services';
import { useToast } from '../../context/ToastContext';
import { LuMapPin, LuLayoutGrid, LuBuilding } from 'react-icons/lu';
import './AdminPages.css';

const DEFAULT_CATEGORIES = [
  { name: 'premium', rows: ['A', 'B'], color: '#fbbf24' },
  { name: 'standard', rows: ['C', 'D', 'E', 'F'], color: '#6c63ff' },
  { name: 'economy', rows: ['G', 'H', 'I', 'J'], color: '#22c55e' },
];

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

const VenueManagement = () => {
  const toast = useToast();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editVenueId, setEditVenueId] = useState(null);

  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      address: { city: '', street: '', state: '' },
      totalRows: 10,
      totalCols: 20,
      categories: DEFAULT_CATEGORIES,
    }
  });

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const { data } = await venuesAPI.getAll();
        setVenues(data.data.venues || []);
      } catch {
        toast.error('Failed to load venues');
      } finally {
        setLoading(false);
      }
    };
    fetchVenues();
  }, []);

  const onSubmit = async (formData) => {
    setSaving(true);
    try {
      
      const processedData = {
        ...formData,
        categories: formData.categories.map((cat) => ({
          ...cat,
          rows: typeof cat.rows === 'string'
            ? cat.rows.split(',').map((r) => r.trim().toUpperCase()).filter(Boolean)
            : cat.rows,
        })),
      };
      
      if (editVenueId) {
        const { data } = await venuesAPI.update(editVenueId, processedData);
        setVenues((prev) => prev.map(v => v._id === editVenueId ? data.data.venue : v));
        toast.success('Venue updated successfully!');
      } else {
        const { data } = await venuesAPI.create(processedData);
        setVenues((prev) => [data.data.venue, ...prev]);
        toast.success('Venue created successfully!');
      }
      
      setShowForm(false);
      setEditVenueId(null);
      reset({
        name: '',
        address: { city: '', street: '', state: '' },
        totalRows: 10,
        totalCols: 20,
        categories: DEFAULT_CATEGORIES,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${editVenueId ? 'update' : 'create'} venue`);
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (venue) => {
    setEditVenueId(venue._id);
    reset({
      name: venue.name,
      address: {
        city: venue.address?.city || '',
        street: venue.address?.street || '',
        state: venue.address?.state || ''
      },
      totalRows: venue.totalRows,
      totalCols: venue.totalCols,
      categories: venue.categories?.length > 0 ? venue.categories.map(c => ({
        ...c,
        rows: c.rows ? c.rows.join(',') : ''
      })) : DEFAULT_CATEGORIES,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="admin-page">
      <div className="container">
        <div className="dashboard-header">
          <div>
            <h1>Venue Management</h1>
            <p className="text-secondary">Create and manage event venues</p>
          </div>
          <button
            id="add-venue-btn"
            className="btn btn-primary"
            onClick={() => {
              if (showForm) {
                setShowForm(false);
                setEditVenueId(null);
                reset({
                  name: '',
                  address: { city: '', street: '', state: '' },
                  totalRows: 10,
                  totalCols: 20,
                  categories: DEFAULT_CATEGORIES,
                });
              } else {
                setShowForm(true);
              }
            }}
          >
            {showForm ? 'Cancel' : '+ Add Venue'}
          </button>
        </div>

        {}
        {showForm && (
          <div className="admin-form-card fade-in">
            <h2>{editVenueId ? 'Edit Venue' : 'Create New Venue'}</h2>
            <form onSubmit={handleSubmit(onSubmit)} id="create-venue-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Venue Name *</label>
                  <input id="venue-name" type="text" className={`form-input ${errors.name ? 'error' : ''}`}
                    placeholder="e.g. PVR Cinemas Multiplex"
                    {...register('name', { required: 'Venue name is required' })} />
                  {errors.name && <span className="form-error">{errors.name.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">City *</label>
                  <input id="venue-city" type="text" className={`form-input ${errors.address?.city ? 'error' : ''}`}
                    placeholder="e.g. Mumbai"
                    {...register('address.city', { required: 'City is required' })} />
                  {errors.address?.city && <span className="form-error">{errors.address.city.message}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Street Address</label>
                  <input id="venue-street" type="text" className="form-input" placeholder="123 Main St"
                    {...register('address.street')} />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input id="venue-state" type="text" className="form-input" placeholder="Maharashtra"
                    {...register('address.state')} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Total Rows *</label>
                  <input id="venue-rows" type="number" className="form-input" min={1} max={50}
                    {...register('totalRows', { required: true, min: 1, max: 50, valueAsNumber: true })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Seats per Row *</label>
                  <input id="venue-cols" type="number" className="form-input" min={1} max={50}
                    {...register('totalCols', { required: true, min: 1, max: 50, valueAsNumber: true })} />
                </div>
              </div>

              {}
              <div className="form-group">
                <label className="form-label">Seat Categories</label>
                <p className="text-muted text-sm mb-sm">Enter row letters for each category (comma-separated, e.g. A,B,C)</p>
                <div className="categories-grid">
                  {['premium', 'standard', 'economy'].map((cat, idx) => (
                    <div key={cat} className={`category-input cat-${cat}`}>
                      <label className="form-label capitalize">{cat}</label>
                      <input
                        id={`cat-${cat}-rows`}
                        type="text"
                        className="form-input"
                        defaultValue={DEFAULT_CATEGORIES[idx]?.rows.join(',')}
                        {...register(`categories.${idx}.rows`)}
                        placeholder="A,B,C"
                      />
                      <input type="hidden" value={cat} {...register(`categories.${idx}.name`)} />
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" id="submit-venue-btn" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : editVenueId ? 'Update Venue' : 'Create Venue'}
              </button>
            </form>
          </div>
        )}

        {}
        {loading ? (
          <div className="loading-container"><div className="spinner" /></div>
        ) : venues.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LuBuilding /></span>
            <h3>No Venues Yet</h3>
            <p>Create your first venue to get started.</p>
          </div>
        ) : (
          <div className="venues-grid">
            {venues.map((venue) => (
              <div key={venue._id} id={`venue-${venue._id}`} className="venue-card">
                <div className="venue-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <h3>{venue.name}</h3>
                    <span className={`badge ${venue.isActive ? 'badge-success' : 'badge-muted'}`}>
                      {venue.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleEditClick(venue)}>Edit</button>
                </div>
                <div className="venue-meta">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><LuMapPin /> {venue.address?.city}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><LuLayoutGrid /> {venue.totalCapacity} seats ({venue.totalRows} × {venue.totalCols})</span>
                </div>
                <div className="venue-categories">
                  {venue.categories?.map((cat) => {
                    const activeRows = generateRowLabels(venue.totalRows || 0);
                    const validRows = cat.rows?.filter(r => activeRows.includes(r.toUpperCase())) || [];
                    if (validRows.length === 0) return null;
                    return (
                      <span key={cat.name} className={`badge cat-badge-${cat.name}`}>
                        {cat.name} ({validRows.join(', ')})
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VenueManagement;
