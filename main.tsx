import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add viewport meta tag for mobile responsiveness
const meta = document.createElement('meta');
meta.name = 'viewport';
meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
document.head.appendChild(meta);

// Add Google Fonts for the retro look
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
document.head.appendChild(link);

// Set document title
document.title = 'Pong Game';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
