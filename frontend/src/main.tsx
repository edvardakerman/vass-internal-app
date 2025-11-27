import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { msalConfig } from './authConfig';
import './index.css';
import App from './App.tsx';

console.log('Starting app initialization...');
console.log('MSAL Config:', msalConfig);

const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL
await msalInstance.initialize();

console.log('MSAL initialized successfully');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MsalProvider instance={msalInstance}>
      <App />
    </MsalProvider>
  </StrictMode>,
);

console.log('App rendered');
