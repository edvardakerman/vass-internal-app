import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import type { SharePointEvent } from '../types';
import { getEvents, signUpForEvent, dropOutFromEvent, getUserRegistrations } from '../api';
import { USE_MOCK_DATA } from '../authConfig';
import './EventDetailsPage.css';

export const EventDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { accounts, instance } = useMsal();
  const [event, setEvent] = useState<SharePointEvent | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const userId = accounts[0]?.localAccountId || '';
  const userEmail = accounts[0]?.username || '';

  useEffect(() => {
    loadEventData();
  }, [id]);

  const loadEventData = async () => {
    try {
      setLoading(true);
      const accessToken = await getAccessToken();
      const [events, registrations] = await Promise.all([
        getEvents(accessToken),
        USE_MOCK_DATA 
          ? loadMockRegistrations()
          : getUserRegistrations(userId, accessToken),
      ]);

      const foundEvent = events.find(e => e.id === id);
      if (foundEvent) {
        setEvent(foundEvent);
        setIsRegistered(registrations.includes(foundEvent.id));
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Error loading event:', err);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const getAccessToken = async (): Promise<string> => {
    if (USE_MOCK_DATA) {
      return 'mock-token';
    }

    const response = await instance.acquireTokenSilent({
      scopes: ['User.Read', 'Calendars.Read'],
      account: accounts[0],
    });
    return response.accessToken;
  };

  const loadMockRegistrations = (): string[] => {
    const stored = localStorage.getItem(`registrations_${userId}`);
    return stored ? JSON.parse(stored) : [];
  };

  const saveMockRegistrations = (eventIds: string[]) => {
    localStorage.setItem(`registrations_${userId}`, JSON.stringify(eventIds));
  };

  const handleSignUp = async () => {
    if (!event) return;
    
    try {
      setActionLoading(true);
      const accessToken = await getAccessToken();
      await signUpForEvent(event.id, userId, userEmail, event.fields.Title, accessToken);

      setIsRegistered(true);

      if (USE_MOCK_DATA) {
        const registrations = loadMockRegistrations();
        saveMockRegistrations([...registrations, event.id]);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to sign up');
      console.error('Error signing up:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDropOut = async () => {
    if (!event) return;

    try {
      setActionLoading(true);
      const accessToken = await getAccessToken();
      await dropOutFromEvent(event.id, userId, accessToken);

      setIsRegistered(false);

      if (USE_MOCK_DATA) {
        const registrations = loadMockRegistrations();
        saveMockRegistrations(registrations.filter(id => id !== event.id));
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to drop out');
      console.error('Error dropping out:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFallbackImage = (category: string) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('health') || categoryLower.includes('sport')) {
      return '/images/kayak.jpg';
    }
    if (categoryLower.includes('social')) {
      return '/images/party.jpg';
    }
    return '/images/kayak.jpg';
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (event) {
      e.currentTarget.src = getFallbackImage(event.fields.Category);
    }
  };

  if (loading) {
    return <div className="event-details-loading">Loading event...</div>;
  }

  if (!event) {
    return null;
  }

  const bannerUrl = event.fields.BannerUrl?.Url || getFallbackImage(event.fields.Category);

  return (
    <div className="event-details-page">
      <button onClick={() => navigate('/')} className="back-button">
        ← Back to Events
      </button>

      <div className="event-details-hero">
        <img 
          src={bannerUrl} 
          alt={event.fields.Title}
          onError={handleImageError}
          className="event-details-banner"
        />
        <div className="event-details-hero-overlay">
          <span className="event-details-category">{event.fields.Category}</span>
          <h1 className="event-details-title">{event.fields.Title}</h1>
        </div>
      </div>

      <div className="event-details-content">
        <div className="event-details-meta">
          <div className="event-meta-item">
            <span className="meta-icon">📅</span>
            <div>
              <div className="meta-label">Start</div>
              <div className="meta-value">{formatDate(event.fields.EventDate)}</div>
            </div>
          </div>
          <div className="event-meta-item">
            <span className="meta-icon">⏰</span>
            <div>
              <div className="meta-label">End</div>
              <div className="meta-value">{formatDate(event.fields.EndDate)}</div>
            </div>
          </div>
          <div className="event-meta-item">
            <span className="meta-icon">📍</span>
            <div>
              <div className="meta-label">Location</div>
              <div className="meta-value">{event.fields.Location}</div>
            </div>
          </div>
        </div>

        <div className="event-details-description">
          <h2>About this event</h2>
          <div 
            dangerouslySetInnerHTML={{ __html: event.fields.Description }}
            className="description-html"
          />
        </div>

        <div className="event-details-actions">
          {isRegistered ? (
            <>
              <div className="registration-status">
                ✓ You are registered for this event
              </div>
              <button 
                onClick={handleDropOut} 
                className="action-button button-secondary"
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : 'Drop Out'}
              </button>
            </>
          ) : (
            <button 
              onClick={handleSignUp} 
              className="action-button button-primary"
              disabled={actionLoading}
            >
              {actionLoading ? 'Processing...' : 'Sign Up for Event'}
            </button>
          )}
          {event.webUrl && (
            <a 
              href={event.webUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="action-button button-link"
            >
              View on SharePoint
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
