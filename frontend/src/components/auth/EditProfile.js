import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../config/axios';
import '../../styles/Auth.css';

const EditProfile = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Load user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setFormData(prevState => ({
        ...prevState,
        name: user.name || '',
        email: user.email || ''
      }));
    } else {
      // Redirect to login if no user data is found
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (formData.newPassword) {
      const strength = checkPasswordStrength(formData.newPassword);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength('');
    }
  }, [formData.newPassword]);

  const checkPasswordStrength = (password) => {
    if (!password) return '';
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;

    const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar, isLongEnough]
      .filter(Boolean).length;

    if (strength <= 2) return 'weak';
    if (strength <= 4) return 'medium';
    return 'strong';
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear previous messages
    setError('');
    setSuccess('');
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate inputs
    if (formData.newPassword && formData.newPassword !== formData.confirmNewPassword) {
      setError('New passwords do not match');
      return;
    }

    if (formData.newPassword && passwordStrength === 'weak') {
      setError('Password is too weak. Please use a stronger password.');
      return;
    }

    setLoading(true);

    try {
      // Only update password if a new one is provided
      const updateData = {
        name: formData.name
      };

      if (formData.currentPassword && formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const response = await axiosInstance.put('/api/auth/update-profile', updateData);
      
      if (response.data && response.data.user) {
        // Update localStorage with new user data
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Update form with new values
        setFormData({
          ...formData,
          name: response.data.user.name,
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: ''
        });
        
        setSuccess('Profile updated successfully');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.response?.data?.message || 'An error occurred while updating your profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Edit Profile</h2>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <form onSubmit={handleUpdateProfile}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter your full name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email (cannot be changed)</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              disabled
              className="disabled-input"
            />
          </div>
          <div className="form-section">
            <h3>Change Password</h3>
            <p className="form-note">Leave blank if you don't want to change your password</p>
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="Enter your current password"
              />
            </div>
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                minLength="6"
                placeholder="Enter your new password"
              />
              {formData.newPassword && (
                <div className={`password-strength ${passwordStrength}`} />
              )}
            </div>
            <div className="form-group">
              <label htmlFor="confirmNewPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmNewPassword"
                name="confirmNewPassword"
                value={formData.confirmNewPassword}
                onChange={handleChange}
                minLength="6"
                placeholder="Confirm your new password"
              />
            </div>
          </div>
          
          <div className="form-buttons">
            <button type="button" className="cancel-button" onClick={() => navigate('/')}>
              Cancel
            </button>
            <button type="submit" className="save-button" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile; 