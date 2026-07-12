
import { useState, useEffect } from 'react';
import { eventsAPI } from '../../api/services';
import EventCard from '../../components/EventCard/EventCard';
import { LuSearch, LuBuilding, LuStar, LuFilm, LuMusic, LuTrophy, LuTicket, LuListMusic } from 'react-icons/lu';
import './Events.css';

const EVENT_TYPES = ['all', 'movie', 'concert', 'sports', 'theater', 'other'];

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    search: '',
    city: '',
    page: 1,
  });
  const [pagination, setPagination] = useState({});

  const fetchEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: filters.page,
        limit: 12,
        status: 'published',
      };
      if (filters.type !== 'all') params.type = filters.type;
      if (filters.search) params.search = filters.search;
      if (filters.city) params.city = filters.city;

      const { data } = await eventsAPI.getAll(params);
      setEvents(data.data.events || []);
      setPagination(data.data.pagination || {});
    } catch (err) {
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [filters.type, filters.page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, page: 1 }));
    fetchEvents();
  };

  return (
    <div className="events-page">
      {}
      <div className="events-hero">
        <div className="hero-bg" />
        <div className="container">
          <h1 className="hero-title">
            Discover <span className="gradient-text">Amazing Events</span>
          </h1>
          <p className="hero-subtitle">
            Movies, Concerts, Sports, Theater — Book your seats instantly
          </p>

          {}
          <form className="search-bar" onSubmit={handleSearch} id="event-search-form">
            <div className="search-input-wrapper">
              <span className="search-icon" style={{ display: 'flex', alignItems: 'center' }}><LuSearch /></span>
              <input
                type="text"
                id="event-search-input"
                className="form-input search-input"
                placeholder="Search events, artists, movies..."
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              />
            </div>
            <div className="search-input-wrapper">
              <span className="search-icon" style={{ display: 'flex', alignItems: 'center' }}><LuBuilding /></span>
              <input
                type="text"
                id="city-search-input"
                className="form-input search-input"
                placeholder="City"
                value={filters.city}
                onChange={(e) => setFilters((prev) => ({ ...prev, city: e.target.value }))}
              />
            </div>
            <button type="submit" className="btn btn-primary" id="search-btn">
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="container">
        {}
        <div className="filter-tabs">
          {EVENT_TYPES.map((type) => (
            <button
              key={type}
              id={`filter-${type}`}
              className={`filter-tab ${filters.type === type ? 'active' : ''}`}
              onClick={() => setFilters((prev) => ({ ...prev, type, page: 1 }))}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {type === 'all' ? <><LuStar /> All</> :
                 type === 'movie' ? <><LuFilm /> Movies</> :
                 type === 'concert' ? <><LuMusic /> Concerts</> :
                 type === 'sports' ? <><LuTrophy /> Sports</> :
                 type === 'theater' ? <><LuListMusic /> Theater</> : <><LuTicket /> Other</>}
              </span>
            </button>
          ))}
        </div>

        {}
        {loading ? (
          <div className="events-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '360px', borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        ) : error ? (
          <div className="alert alert-error mt-lg">{error}</div>
        ) : events.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LuListMusic /></span>
            <h3>No Events Found</h3>
            <p>Try adjusting your search filters or check back later.</p>
          </div>
        ) : (
          <>
            <div className="events-results-header">
              <span>{pagination.total || events.length} events found</span>
            </div>
            <div className="events-grid">
              {events.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>

            {}
            {pagination.pages > 1 && (
              <div className="pagination">
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={filters.page <= 1}
                  onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
                  id="prev-page-btn"
                >
                  ← Previous
                </button>
                <span className="page-info">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={filters.page >= pagination.pages}
                  onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
                  id="next-page-btn"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Events;
