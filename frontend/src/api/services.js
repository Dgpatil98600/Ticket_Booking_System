
import api from './axiosClient';

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
};

export const eventsAPI = {
  getAll: (params) => api.get('/events', { params }),
  getById: (id) => api.get(`/events/${id}`),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
  updateStatus: (id, status) => api.patch(`/events/${id}/status`, { status }),
  getOrganizerEvents: (params) => api.get('/events/organizer/my', { params }),
};

export const venuesAPI = {
  getAll: (params) => api.get('/venues', { params }),
  getById: (id) => api.get(`/venues/${id}`),
  create: (data) => api.post('/venues', data),
  update: (id, data) => api.put(`/venues/${id}`, data),
  delete: (id) => api.delete(`/venues/${id}`),
};

export const seatsAPI = {
  getEventSeats: (eventId) => api.get(`/seats/event/${eventId}`),
  holdSeats: (data) => api.post('/seats/hold', data),
  releaseSeats: (data) => api.delete('/seats/hold', { data }),
};

export const bookingsAPI = {
  create: (data) => api.post('/bookings', data),
  getMyBookings: (params) => api.get('/bookings/my', { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  cancel: (id, reason) => api.delete(`/bookings/${id}`, { data: { reason } }),
  verify: (bookingRef) => api.get(`/bookings/verify/${bookingRef}`),
  getEventBookings: (eventId, params) => api.get(`/bookings/event/${eventId}`, { params }),
};

export const waitlistAPI = {
  join: (data) => api.post('/waitlists/join', data),
  getMyEntries: () => api.get('/waitlists/my'),
  leave: (id) => api.delete(`/waitlists/${id}`),
  claimOffer: (token) => api.get(`/waitlists/claim/${token}`),
};

export const dashboardAPI = {
  getOrganizerDashboard: () => api.get('/dashboard/organizer'),
  getAdminDashboard: () => api.get('/dashboard/admin'),
  getAllUsers: (params) => api.get('/dashboard/admin/users', { params }),
  updateUserRole: (id, role) => api.patch(`/dashboard/admin/users/${id}/role`, { role }),
  toggleUserStatus: (id) => api.patch(`/dashboard/admin/users/${id}/toggle`),
};
