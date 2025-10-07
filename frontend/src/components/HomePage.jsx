import { useState } from 'react';
import Login from './Login';
import './HomePage.css';

function HomePage({ onLogin, apiUrl }) {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  if (showLogin) {
    return <Login onLogin={onLogin} apiUrl={apiUrl} isRegister={false} onToggle={() => setShowLogin(false)} />;
  }

  if (showRegister) {
    return <Login onLogin={onLogin} apiUrl={apiUrl} isRegister={true} onToggle={() => setShowRegister(false)} />;
  }

  return (
    <div className="homepage">
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="logo">
            <h1>💬 RealTime Chat</h1>
          </div>
          <nav className="nav">
            <a href="#features">Features</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
            <button onClick={() => setShowLogin(true)} className="login-btn">Login</button>
            <button onClick={() => setShowRegister(true)} className="signup-btn">Sign Up</button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1>Connect Instantly with Real-Time Chat</h1>
            <p>Experience seamless communication with our modern chat application. Connect with friends, colleagues, and communities in real-time.</p>
            <div className="hero-buttons">
              <button onClick={() => setShowRegister(true)} className="cta-primary">Get Started Free</button>
              <button onClick={() => setShowLogin(true)} className="cta-secondary">Sign In</button>
            </div>
          </div>
          <div className="hero-image">
            <div className="chat-preview">
              <div className="chat-bubble left">Hey! How are you?</div>
              <div className="chat-bubble right">I'm great! Thanks for asking 😊</div>
              <div className="chat-bubble left">Want to grab coffee later?</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <h2>Why Choose RealTime Chat?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Instant Messaging</h3>
              <p>Messages appear instantly with our real-time WebSocket technology. No delays, no waiting.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure & Private</h3>
              <p>Your conversations are protected with JWT authentication and secure data transmission.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Responsive Design</h3>
              <p>Works perfectly on desktop, tablet, and mobile devices. Chat anywhere, anytime.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>User Status</h3>
              <p>See when your friends are online or when they were last active. Stay connected.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💾</div>
              <h3>Message History</h3>
              <p>All your conversations are saved and synced across devices. Never lose important messages.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🚀</div>
              <h3>Fast & Reliable</h3>
              <p>Built with modern technologies like NestJS, React, and PostgreSQL for optimal performance.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about">
        <div className="container">
          <div className="about-content">
            <div className="about-text">
              <h2>About RealTime Chat</h2>
              <p>RealTime Chat is a modern messaging application built with cutting-edge technologies to provide the best user experience. Our platform focuses on speed, security, and simplicity.</p>
              <p>Whether you're connecting with friends, collaborating with colleagues, or building communities, RealTime Chat provides the tools you need for effective communication.</p>
              <ul>
                <li>✅ Real-time messaging with Socket.IO</li>
                <li>✅ Secure JWT authentication</li>
                <li>✅ PostgreSQL database for reliability</li>
                <li>✅ Docker containerization for scalability</li>
                <li>✅ PM2 cluster mode for high availability</li>
              </ul>
            </div>
            <div className="about-stats">
              <div className="stat">
                <h3> 100ms</h3>
                <p>Message Delivery</p>
              </div>
              <div className="stat">
                <h3>99.9%</h3>
                <p>Uptime</p>
              </div>
              <div className="stat">
                <h3>24/7</h3>
                <p>Available</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>💬 RealTime Chat</h3>
              <p>Connect instantly with friends and colleagues through our modern real-time messaging platform.</p>
            </div>
            <div className="footer-section">
              <h4>Features</h4>
              <ul>
                <li><a href="#features">Instant Messaging</a></li>
                <li><a href="#features">User Status</a></li>
                <li><a href="#features">Message History</a></li>
                <li><a href="#features">Responsive Design</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Company</h4>
              <ul>
                <li><a href="#about">About Us</a></li>
                <li><a href="#privacy">Privacy Policy</a></li>
                <li><a href="#terms">Terms of Service</a></li>
                <li><a href="#support">Support</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Connect</h4>
              <ul>
                <li><a href="#contact">Contact Us</a></li>
                <li><a href="#github">GitHub</a></li>
                <li><a href="#docs">Documentation</a></li>
                <li><a href="#api">API</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 RealTime Chat. All rights reserved. Built with ❤️ using NestJS and React.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
