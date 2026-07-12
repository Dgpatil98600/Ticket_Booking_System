
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { LuTicket } from 'react-icons/lu';
import './Auth.css';

const Register = () => {
  const { register: registerUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: { role: 'customer' } });

  const selectedRole = watch('role');

  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: formData.phone,
      };
      if (formData.role === 'admin') {
        payload.adminSecret = formData.adminSecret;
      }

      const user = await registerUser(payload);
      toast.success(`Welcome to TicketMaster, ${user.name}!`);

      if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'organizer') navigate('/organizer/dashboard');
      else navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-container">
        <div className="auth-card fade-in">
          <div className="auth-header">
            <Link to="/" className="auth-logo">
              <span style={{ display: 'flex', alignItems: 'center', marginRight: '8px', fontSize: '1.5rem' }}><LuTicket /></span>
              <span className="gradient-text">TicketMaster</span>
            </Link>
            <h2>Create Account</h2>
            <p>Join thousands of event-goers today</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="auth-form" id="register-form">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                id="register-name"
                type="text"
                className={`form-input ${errors.name ? 'error' : ''}`}
                placeholder="John Doe"
                {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'At least 2 characters' } })}
              />
              {errors.name && <span className="form-error">{errors.name.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                id="register-email"
                type="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="you@example.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' },
                })}
              />
              {errors.email && <span className="form-error">{errors.email.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Phone (optional)</label>
              <input
                id="register-phone"
                type="tel"
                className="form-input"
                placeholder="+91 9876543210"
                {...register('phone')}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                id="register-password"
                type="password"
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="At least 6 characters"
                {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'At least 6 characters' } })}
              />
              {errors.password && <span className="form-error">{errors.password.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Account Type</label>
              <select
                id="register-role"
                className="form-input form-select"
                {...register('role')}
              >
                <option value="customer">Customer – Book Tickets</option>
                <option value="organizer">Organizer – Create Events</option>
                <option value="admin">Admin – Manage Platform</option>
              </select>
            </div>

            {selectedRole === 'admin' && (
              <div className="form-group">
                <label className="form-label">Admin Secret Key</label>
                <input
                  id="register-admin-secret"
                  type="password"
                  className={`form-input ${errors.adminSecret ? 'error' : ''}`}
                  placeholder="Enter admin secret"
                  {...register('adminSecret', {
                    required: selectedRole === 'admin' ? 'Admin secret is required' : false,
                  })}
                />
                {errors.adminSecret && <span className="form-error">{errors.adminSecret.message}</span>}
              </div>
            )}

            <button
              type="submit"
              id="register-submit-btn"
              className="btn btn-primary btn-block btn-lg"
              disabled={loading}
            >
              {loading ? (
                <><span className="spinner spinner-sm" /> Creating account...</>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="auth-link">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
