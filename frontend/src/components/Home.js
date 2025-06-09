import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <section className="hero">
        <div className="hero-particles"></div>
        <h1>Master Your Interview Skills</h1>
        <p>Practice, receive feedback, and improve your interview performance with our AI-powered platform.</p>
        <div className="cta-buttons">
          <Link to="/questions" className="cta-button">Practice Questions</Link>
          <Link to="/video-interview" className="cta-button primary">Video Interview</Link>
          <Link to="/text-interview" className="cta-button">Text Interview</Link>
        </div>
        <div className="hero-badge">
          <span>New Feature</span>
        </div>
      </section>

      <section className="interview-modes">
        <h2>Choose Your Interview Mode</h2>
        <div className="section-subtitle">Practice in multiple formats to prepare for any interview scenario</div>
        <div className="modes-container">
          <div className="mode-card video-mode">
            <div className="mode-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64">
                <path fill="none" d="M0 0h24v24H0z"/>
                <path d="M17 9.2l5.213-3.65a.5.5 0 0 1 .787.41v12.08a.5.5 0 0 1-.787.41L17 14.8V19a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v4.2zm0 3.159l4 2.8V8.84l-4 2.8v.718zM3 6v12h12V6H3zm2 2h2v2H5V8z" fill="currentColor"/>
              </svg>
            </div>
            <h3>Video Interview</h3>
            <p>Record your interview responses and receive feedback on your delivery, body language, and content.</p>
            <Link to="/video-interview" className="mode-button">Start Video Interview</Link>
          </div>
          
          <div className="mode-card text-mode">
            <div className="mode-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64">
                <path fill="none" d="M0 0h24v24H0z"/>
                <path d="M21 3a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h18zm-1 2H4v14h16V5zm-2 2v2H6V7h12zm0 4v2H6v-2h12zm-6 4v2H6v-2h6z" fill="currentColor"/>
              </svg>
            </div>
            <h3>Text Interview</h3>
            <p>Practice your written responses to interview questions and get AI-powered feedback on your answers.</p>
            <Link to="/text-interview" className="mode-button">Start Text Interview</Link>
          </div>
          
          <div className="mode-card practice-mode">
            <div className="mode-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64">
                <path fill="none" d="M0 0h24v24H0z"/>
                <path d="M2 3.993A1 1 0 0 1 2.992 3h18.016c.548 0 .992.445.992.993v16.014a1 1 0 0 1-.992.993H2.992A.993.993 0 0 1 2 20.007V3.993zM4 5v14h16V5H4zm2 2h6v6H6V7zm2 2v2h2V9H8zm-2 6h12v2H6v-2zm8-8h4v2h-4V7zm0 4h4v2h-4v-2z" fill="currentColor"/>
              </svg>
            </div>
            <h3>Practice Questions</h3>
            <p>Browse through common interview questions for different roles and practice your responses.</p>
            <Link to="/questions" className="mode-button">View Questions</Link>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="stat-item">
          <div className="stat-number">98%</div>
          <div className="stat-label">Success Rate</div>
          <p>Of our users report improved interview confidence</p>
        </div>
        <div className="stat-item">
          <div className="stat-number">15K+</div>
          <div className="stat-label">Questions</div>
          <p>Curated interview questions across all industries</p>
        </div>
        <div className="stat-item">
          <div className="stat-number">24/7</div>
          <div className="stat-label">Practice</div>
          <p>Unlimited access to interview preparation tools</p>
        </div>
      </section>

      <section className="resume-spotlight">
        <div className="spotlight-content">
          <h2>Get Personalized Interview Questions</h2>
          <p>Upload your resume and our AI will analyze your skills, experience, and education to generate customized interview questions specifically tailored to your background.</p>
          <ul className="spotlight-benefits">
            <li>Extract key skills from your resume</li>
            <li>Generate questions based on your work experience</li>
            <li>Prepare for questions related to your education</li>
            <li>Practice with real-world scenarios relevant to your background</li>
          </ul>
          <Link to="/resume" className="spotlight-button">Upload Your Resume</Link>
        </div>
        <div className="spotlight-image">
          <div className="image-placeholder">
            <div className="resume-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64">
                <path fill="none" d="M0 0h24v24H0z"/>
                <path d="M3 8l6.003-6h10.995C20.55 2 21 2.455 21 2.992v18.016a.993.993 0 0 1-.993.992H3.993A1 1 0 0 1 3 20.993V8zm7-4v5H5v11h14V4h-9z" fill="currentColor"/>
                <path d="M8 12h8v2H8v-2zm0 4h8v2H8v-2z" fill="currentColor"/>
              </svg>
            </div>
          </div>
        </div>
      </section>

      <section className="testimonials">
        <h2>What Our Users Say</h2>
        <div className="testimonials-container">
          <div className="testimonial-card">
            <div className="testimonial-quote">"This platform helped me prepare for my software engineering interview at Google. The video interview feature was a game-changer!"</div>
            <div className="testimonial-author">
              <div className="testimonial-avatar">MJ</div>
              <div className="testimonial-info">
                <div className="testimonial-name">Michael Johnson</div>
                <div className="testimonial-position">Software Engineer at Google</div>
              </div>
            </div>
          </div>
          
          <div className="testimonial-card">
            <div className="testimonial-quote">"I used to be so nervous during interviews, but after practicing with the video feature, I feel much more confident. Landed my dream job!"</div>
            <div className="testimonial-author">
              <div className="testimonial-avatar">SC</div>
              <div className="testimonial-info">
                <div className="testimonial-name">Sarah Chen</div>
                <div className="testimonial-position">Product Manager at Adobe</div>
              </div>
            </div>
          </div>
          
          <div className="testimonial-card">
            <div className="testimonial-quote">"The AI-powered feedback system helped me improve my responses dramatically. The platform is intuitive and incredibly helpful."</div>
            <div className="testimonial-author">
              <div className="testimonial-avatar">JD</div>
              <div className="testimonial-info">
                <div className="testimonial-name">James Davis</div>
                <div className="testimonial-position">Marketing Director at Shopify</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <h2>Additional Features</h2>
        <div className="feature-cards">
          <div className="feature-card">
            <h3>Resume Analysis</h3>
            <p>Upload your resume to get personalized interview questions based on your skills and experience.</p>
            <Link to="/resume" className="feature-link">Upload Now</Link>
          </div>
          <div className="feature-card">
            <h3>Speech Analysis</h3>
            <p>Get detailed feedback on your speaking patterns, clarity, and confidence.</p>
            <Link to="/speech-analysis" className="feature-link">Analyze Speech</Link>
          </div>
          <div className="feature-card">
            <h3>Progress Tracking</h3>
            <p>Monitor your improvement over time with detailed analytics and insights.</p>
            <Link to="/progress" className="feature-link">View Progress</Link>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Ace Your Next Interview?</h2>
          <p>Start practicing today and build the confidence you need to succeed.</p>
          <Link to="/video-interview" className="cta-button primary">Try Video Interview</Link>
        </div>
      </section>

      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Interview Prep Platform</h3>
            <p>Your path to interview success starts here. Practice, prepare, and perfect your interview skills.</p>
          </div>
          <div className="footer-section">
            <h3>Features</h3>
            <ul>
              <li><Link to="/video-interview">Video Interview</Link></li>
              <li><Link to="/text-interview">Text Interview</Link></li>
              <li><Link to="/questions">Practice Questions</Link></li>
              <li><Link to="/speech-analysis">Speech Analysis</Link></li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Resources</h3>
            <ul>
              <li><a href="#">Interview Tips</a></li>
              <li><a href="#">Resume Guide</a></li>
              <li><a href="#">Career Blog</a></li>
              <li><a href="#">Success Stories</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Interview Prep Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home; 