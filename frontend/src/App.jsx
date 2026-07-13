
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar/Navbar';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import { LuTicket } from 'react-icons/lu';

import Events from './pages/Events/Events';
import EventDetail from './pages/EventDetail/EventDetail';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Checkout from './pages/Checkout/Checkout';
import BookingHistory from './pages/Bookings/BookingHistory';
import BookingDetail from './pages/Bookings/BookingDetail';
import OrganizerDashboard from './pages/Dashboard/OrganizerDashboard';
import AdminDashboard from './pages/Dashboard/AdminDashboard';
import VenueManagement from './pages/Admin/VenueManagement';
import CreateEvent from './pages/Organizer/CreateEvent';
import WaitlistClaim from './pages/Waitlist/WaitlistClaim';
import WaitlistHistory from './pages/Waitlist/WaitlistHistory';

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <ToastProvider>
            <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              <Navbar />
              <main style={{ flex: 1 }}>
                <Routes>
                  {}
                  <Route path="/" element={<Events />} />
                  <Route path="/events/:id" element={<EventDetail />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  {}
                  <Route path="/verify/:bookingRef" element={<div>Verify Route</div>} />

                  {}
                  <Route
                    path="/checkout"
                    element={
                      <ProtectedRoute roles={['customer', 'admin']}>
                        <Checkout />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/bookings"
                    element={
                      <ProtectedRoute roles={['customer', 'admin']}>
                        <BookingHistory />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/waitlists"
                    element={
                      <ProtectedRoute roles={['customer', 'admin']}>
                        <WaitlistHistory />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/bookings/:id"
                    element={
                      <ProtectedRoute>
                        <BookingDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/waitlist/claim/:token"
                    element={
                      <ProtectedRoute>
                        <WaitlistClaim />
                      </ProtectedRoute>
                    }
                  />

                  {}
                  <Route
                    path="/organizer/dashboard"
                    element={
                      <ProtectedRoute roles={['organizer', 'admin']}>
                        <OrganizerDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/organizer/events/new"
                    element={
                      <ProtectedRoute roles={['organizer', 'admin']}>
                        <CreateEvent />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/organizer/events/:id/edit"
                    element={
                      <ProtectedRoute roles={['organizer', 'admin']}>
                        <CreateEvent />
                      </ProtectedRoute>
                    }
                  />

                  {}
                  <Route
                    path="/admin/dashboard"
                    element={
                      <ProtectedRoute roles={['admin']}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/venues"
                    element={
                      <ProtectedRoute roles={['admin']}>
                        <VenueManagement />
                      </ProtectedRoute>
                    }
                  />

                  {}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          </ToastProvider>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
