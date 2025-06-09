import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EditProfileModal from './modals/EditProfileModal';
import '../styles/Navbar.css';

const Navbar = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Add click event listener to close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleEditProfile = () => {
    setShowDropdown(false);
    setShowEditModal(true);
  };

  const handleProfileUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  // Get first letter of user's name for avatar fallback
  const getInitial = () => {
    return user && user.name ? user.name.charAt(0).toUpperCase() : '?';
  };

  // Check if user has a profile picture
  const hasProfilePicture = () => {
    return user && user.profilePicture && user.profilePicture.trim() !== '';
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand">
          <Link to="/">Interview Prep Platform</Link>
        </div>
        <div className="navbar-links">
          <Link to="/">Home</Link>
          <Link to="/questions">Practice Questions</Link>
          {/* <Link to="/video-interview" className="featured-link"> */}
          <Link to="/video-interview">
            {/* <span className="video-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
                <path fill="none" d="M0 0h24v24H0z"/>
                <path d="M17 9.2l5.213-3.65a.5.5 0 0 1 .787.41v12.08a.5.5 0 0 1-.787.41L17 14.8V19a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v4.2z" fill="currentColor"/>
              </svg>
            </span> */}
            Video Interview
          </Link>
          <Link to="/text-interview">Text Interview</Link>
          <Link to="/speech-analysis">Speech Analysis</Link>
          <Link to="/progress">Progress Tracker</Link>
        </div>
        <div className="navbar-actions">
          <Link to="/resume" className="resume-link">
            <span className="resume-icon">📄</span>
            Resume
          </Link>
          <div className="profile-container" ref={dropdownRef}>
            <button className="profile-button" onClick={toggleDropdown}>
              {hasProfilePicture() ? (
                <img 
                  src={user.profilePicture} 
                  alt={user.name} 
                  className="avatar-image" 
                  onError={(e) => {
                    e.target.onerror = null;
                    // Replace with a fallback avatar div since the image failed to load
                    const fallbackAvatar = document.createElement('div');
                    fallbackAvatar.className = 'avatar';
                    fallbackAvatar.textContent = getInitial();
                    e.target.parentNode.replaceChild(fallbackAvatar, e.target);
                  }}
                />
              ) : (
                <div className="avatar">{getInitial()}</div>
              )}
            </button>
            {showDropdown && (
              <div className="profile-dropdown">
                <div className="user-info">
                  {hasProfilePicture() && (
                    <div className="dropdown-avatar">
                      <img src={user.profilePicture} alt={user.name} />
                    </div>
                  )}
                  <div className="user-details">
                    <span className="user-name">{user ? user.name : 'User'}</span>
                    <span className="user-email">{user ? user.email : 'user@example.com'}</span>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item" onClick={handleEditProfile}>
                  <span className="dropdown-icon">✏️</span> Edit Profile
                </button>
                <Link to="/resume" className="dropdown-item">
                  <span className="dropdown-icon">📄</span> My Resume
                </Link>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item" onClick={handleLogout}>
                  <span className="dropdown-icon">🚪</span> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {showEditModal && (
        <EditProfileModal 
          onClose={() => setShowEditModal(false)} 
          user={user}
          onProfileUpdate={handleProfileUpdate}
        />
      )}
    </>
  );
};

export default Navbar; 