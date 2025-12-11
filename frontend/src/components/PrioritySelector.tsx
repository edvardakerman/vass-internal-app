import { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import type { SharePointEvent } from '../types';
import { getEvents } from '../api';
import { USE_MOCK_DATA } from '../authConfig';
import '../styles/PrioritySelector.css';

interface PriorityItem {
  eventId: string;
  eventTitle: string;
  priority: number;
}

export const PrioritySelector = () => {
  const { accounts, instance } = useMsal();
  const [events, setEvents] = useState<SharePointEvent[]>([]);
  const [healthPriorities, setHealthPriorities] = useState<PriorityItem[]>([]);
  const [socialPriorities, setSocialPriorities] = useState<PriorityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const userId = accounts[0]?.localAccountId || '';

  useEffect(() => {
    loadEvents();
    loadSavedPriorities();
  }, []);

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

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const accessToken = await getAccessToken();
      const eventsData = await getEvents(accessToken);
      setEvents(eventsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedPriorities = () => {
    const saved = localStorage.getItem(`priorities_${userId}`);
    if (saved) {
      const { health, social } = JSON.parse(saved);
      setHealthPriorities(health || []);
      setSocialPriorities(social || []);
    }
  };

  const savePriorities = () => {
    localStorage.setItem(`priorities_${userId}`, JSON.stringify({
      health: healthPriorities,
      social: socialPriorities,
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const getCategoryEvents = (category: string): SharePointEvent[] => {
    return events.filter(e => 
      e.fields.Category.toLowerCase().includes(category.toLowerCase())
    );
  };

  const handlePriorityChange = (
    eventId: string,
    newPriority: number,
    category: 'Health' | 'Social',
    eventTitle: string
  ) => {
    const setPriorities = category === 'Health' ? setHealthPriorities : setSocialPriorities;
    const currentPriorities = category === 'Health' ? healthPriorities : socialPriorities;

    const existing = currentPriorities.find(p => p.eventId === eventId);
    
    if (existing) {
      setPriorities(currentPriorities.map(p => 
        p.eventId === eventId ? { ...p, priority: newPriority } : p
      ));
    } else {
      setPriorities([...currentPriorities, { eventId, eventTitle, priority: newPriority }]);
    }
  };

  const handleRemovePriority = (eventId: string, category: 'Health' | 'Social') => {
    const setPriorities = category === 'Health' ? setHealthPriorities : setSocialPriorities;
    const currentPriorities = category === 'Health' ? healthPriorities : socialPriorities;
    
    setPriorities(currentPriorities.filter(p => p.eventId !== eventId));
  };

  const renderCategorySection = (category: 'Health' | 'Social') => {
    const categoryEvents = getCategoryEvents(category);
    const priorities = category === 'Health' ? healthPriorities : socialPriorities;
    const maxPriority = categoryEvents.length;

    return (
      <div className="category-section">
        <h3>{category} Events</h3>
        {categoryEvents.length === 0 ? (
          <p className="no-events">No {category.toLowerCase()} events available</p>
        ) : (
          <div className="priority-list">
            {categoryEvents.map((event) => {
              const userPriority = priorities.find(p => p.eventId === event.id);
              
              return (
                <div key={event.id} className="priority-item">
                  <div className="event-info">
                    <span className="event-title">{event.fields.Title}</span>
                    <span className="event-date">
                      {new Date(event.fields.EventDate).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="priority-controls">
                    {userPriority ? (
                      <>
                        <select
                          value={userPriority.priority}
                          onChange={(e) => handlePriorityChange(
                            event.id,
                            parseInt(e.target.value),
                            category,
                            event.fields.Title
                          )}
                          className="priority-select"
                        >
                          {Array.from({ length: maxPriority }, (_, i) => i + 1).map(num => (
                            <option key={num} value={num}>
                              Priority {num}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleRemovePriority(event.id, category)}
                          className="button button-remove"
                        >
                          Remove
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handlePriorityChange(
                          event.id,
                          1,
                          category,
                          event.fields.Title
                        )}
                        className="button button-add"
                      >
                        Add to Priorities
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="loading">Loading events...</div>;
  }

  return (
    <div className="priority-selector">
      <div className="priority-header">
        <h2>Set Event Priorities</h2>
        <p>Arrange your preferred priority order for Health and Social events separately</p>
      </div>

      {error && <div className="error">Error: {error}</div>}

      <div className="categories-container">
        {renderCategorySection('Health')}
        {renderCategorySection('Social')}
      </div>

      <div className="priority-footer">
        <button onClick={savePriorities} className="button button-primary">
          Save Priorities
        </button>
        {saved && <span className="saved-message">✓ Priorities saved!</span>}
      </div>
    </div>
  );
};
