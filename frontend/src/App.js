import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Home from './components/Home';
import InterviewQuestions from './components/InterviewQuestions';
import ProgressTracker from './components/ProgressTracker';
import Feedback from './components/Feedback';
import Navbar from './components/Navbar';
import ResumeUpload from './components/Resume/ResumeUpload';
import ResumeView from './components/Resume/ResumeView';
import SpeechToText from './components/SpeechToText';
import TextInterview from './components/TextInterview';
import TextInterviewResults from './components/TextInterviewResults';
import VideoInterview from './components/VideoInterview';
import VideoReview from './components/VideoReview';
import './styles/App.css';

// Create a placeholder SharedVideo component until we implement the actual one
const SharedVideo = () => (
  <div className="shared-video-container">
    <h2>Shared Video</h2>
    <p>This shared video feature is coming soon.</p>
  </div>
);

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <>
                  <Navbar />
                  <main className="main-content">
                    <Home />
                  </main>
                </>
              </PrivateRoute>
            }
          />
          <Route 
            path="/interview" 
            element={<Navigate to="/questions" replace />} 
          />
          <Route
            path="/questions"
            element={
              <PrivateRoute>
                <>
                  <Navbar />
                  <main className="main-content">
                    <InterviewQuestions />
                  </main>
                </>
              </PrivateRoute>
            }
          />
          <Route
            path="/progress"
            element={
              <PrivateRoute>
                <>
                  <Navbar />
                  <main className="main-content">
                    <ProgressTracker />
                  </main>
                </>
              </PrivateRoute>
            }
          />
          <Route
            path="/feedback"
            element={
              <PrivateRoute>
                <>
                  <Navbar />
                  <main className="main-content">
                    <Feedback />
                  </main>
                </>
              </PrivateRoute>
            }
          />
          <Route 
            path="/resume/upload" 
            element={
              <PrivateRoute>
                <>
                  <Navbar />
                  <main className="main-content">
                    <ResumeUpload />
                  </main>
                </>
              </PrivateRoute>
            } 
          />
          <Route 
            path="/resume" 
            element={
              <PrivateRoute>
                <>
                  <Navbar />
                  <main className="main-content">
                    <ResumeView />
                  </main>
                </>
              </PrivateRoute>
            } 
          />
          <Route
            path="/speech-analysis"
            element={
              <PrivateRoute>
                <>
                  <Navbar />
                  <main className="main-content">
                    <SpeechToText />
                  </main>
                </>
              </PrivateRoute>
            }
          />
          <Route
            path="/text-interview"
            element={
              <PrivateRoute>
                <>
                  <Navbar />
                  <main className="main-content">
                    <TextInterview />
                  </main>
                </>
              </PrivateRoute>
            }
          />
          <Route
            path="/text-interview-results"
            element={
              <PrivateRoute>
                <>
                  <Navbar />
                  <main className="main-content">
                    <TextInterviewResults />
                  </main>
                </>
              </PrivateRoute>
            }
          />
          <Route
            path="/video-interview"
            element={
              <PrivateRoute>
                <>
                  <Navbar />
                  <main className="main-content">
                    <VideoInterview />
                  </main>
                </>
              </PrivateRoute>
            }
          />
          <Route
            path="/video-interview/review/:sessionId"
            element={
              <PrivateRoute>
                <>
                  <Navbar />
                  <main className="main-content">
                    <VideoReview />
                  </main>
                </>
              </PrivateRoute>
            }
          />
          {/* Shared video route - no authentication required */}
          <Route
            path="/shared-video/:shareId"
            element={
              <>
                <Navbar />
                <main className="main-content">
                  <SharedVideo />
                </main>
              </>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
