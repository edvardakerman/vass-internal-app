import { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import type { SharePointEvent } from '../types';
import { getEvents, signUpForEvent, dropOutFromEvent, getUserRegistrations } from '../api';
import { USE_MOCK_DATA } from '../authConfig';
import { EventCard } from './EventCard';

export const EventList = () => {
  const { accounts, instance } = useMsal();
  const [events, setEvents] = useState<SharePointEvent[]>([]);
  const [registeredEvents, setRegisteredEvents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = accounts[0]?.localAccountId || '';
  const userEmail = accounts[0]?.username || '';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const accessToken = await getAccessToken();
      const [eventsData, registrations] = await Promise.all([
        getEvents(accessToken),
        USE_MOCK_DATA 
          ? loadMockRegistrations()
          : getUserRegistrations(userId, accessToken),
      ]);

      setEvents(eventsData);
      setRegisteredEvents(registrations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error loading data:', err);
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

  const handleSignUp = async (event: SharePointEvent, priority?: number) => {
    try {
      const accessToken = await getAccessToken();
      await signUpForEvent(event.id, userId, userEmail, event.fields.Title, accessToken);

      const updatedRegistrations = [...registeredEvents, event.id];
      setRegisteredEvents(updatedRegistrations);

      // Store priority if provided
      if (priority) {
        const category = event.fields.Category.toLowerCase().includes('health') ? 'Health' : 'Social';
        const priorities = localStorage.getItem(`priorities_${userId}`);
        const existingPriorities = priorities ? JSON.parse(priorities) : { health: [], social: [] };
        
        const categoryKey = category.toLowerCase();
        existingPriorities[categoryKey] = existingPriorities[categoryKey] || [];
        existingPriorities[categoryKey] = existingPriorities[categoryKey].filter((p: any) => p.eventId !== event.id);
        existingPriorities[categoryKey].push({ eventId: event.id, eventTitle: event.fields.Title, priority });
        
        localStorage.setItem(`priorities_${userId}`, JSON.stringify(existingPriorities));
      }

      if (USE_MOCK_DATA) {
        saveMockRegistrations(updatedRegistrations);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to sign up');
      console.error('Error signing up:', err);
    }
  };

  const handleDropOut = async (eventId: string) => {
    try {
      const accessToken = await getAccessToken();
      await dropOutFromEvent(eventId, userId, accessToken);

      const updatedRegistrations = registeredEvents.filter(id => id !== eventId);
      setRegisteredEvents(updatedRegistrations);

      if (USE_MOCK_DATA) {
        saveMockRegistrations(updatedRegistrations);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to drop out');
      console.error('Error dropping out:', err);
    }
  };

  const getCategoryEvents = (category: string) => {
    return events.filter(e => e.fields.Category.toLowerCase().includes(category.toLowerCase()));
  };

  const healthEvents = getCategoryEvents('health');
  const socialEvents = getCategoryEvents('social');

  if (loading) {
    return <div className="loading">Loading events...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="event-list">
      <div className="event-list-header">
        <h2>Available Events</h2>
        {USE_MOCK_DATA && (
          <span className="mock-badge">Using Mock Data</span>
        )}
      </div>

      {events.length === 0 ? (
        <p>No events available.</p>
      ) : (
        <>
          {/* Health Events */}
          {healthEvents.length > 0 && (
            <div className="category-events">
              <h3>Health Events</h3>
              <div className="events-grid">
                {healthEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isRegistered={registeredEvents.includes(event.id)}
                    onSignUp={(priority) => handleSignUp(event, priority)}
                    onDropOut={() => handleDropOut(event.id)}
                    categoryEventCount={healthEvents.length}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Social Events */}
          {socialEvents.length > 0 && (
            <div className="category-events">
              <h3>Social Events</h3>
              <div className="events-grid">
                {socialEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isRegistered={registeredEvents.includes(event.id)}
                    onSignUp={(priority) => handleSignUp(event, priority)}
                    onDropOut={() => handleDropOut(event.id)}
                    categoryEventCount={socialEvents.length}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
