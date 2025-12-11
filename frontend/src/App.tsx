import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from '@azure/msal-react';
import { SignInButton } from './components/SignInButton';
import { SignOutButton } from './components/SignOutButton';
import { EventList } from './components/EventList';
import { EventDetailsPage } from './pages/EventDetailsPage';
import './App.css';

function AppContent() {
  const { accounts } = useMsal();

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-logo-section">
          <img src="/images/LOGO_VASS_RGB.png" alt="VASS Logo" className="vass-logo" />
          <h1>Internal Activities</h1>
        </div>
        <AuthenticatedTemplate>
          <div className="user-info">
            <span>Welcome, {accounts[0]?.name || accounts[0]?.username}</span>
            <SignOutButton />
          </div>
        </AuthenticatedTemplate>
      </header>

      <main className="app-main">
        <UnauthenticatedTemplate>
          <div className="auth-container">
            <h2>Sign in to view and register for events</h2>
            <SignInButton />
          </div>
        </UnauthenticatedTemplate>

        <AuthenticatedTemplate>
          <Routes>
            <Route path="/" element={<EventList />} />
            <Route path="/event/:id" element={<EventDetailsPage />} />
          </Routes>
        </AuthenticatedTemplate>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
