import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { SharePointEvent } from '../types';

interface EventCardProps {
  event: SharePointEvent;
  isRegistered: boolean;
  onSignUp: (priority?: number) => void;
  onDropOut: () => void;
  categoryEventCount: number;
}

export const EventCard = ({ event, isRegistered, onSignUp, onDropOut, categoryEventCount }: EventCardProps) => {
  const [selectedPriority, setSelectedPriority] = useState<number | ''>('');

  const formatDate = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const getFallbackImage = (category: string) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('health') || categoryLower.includes('sport')) {
      return '/images/kayak.jpg';
    }
    if (categoryLower.includes('social')) {
      return '/images/party.jpg';
    }
    return '/images/kayak.jpg'; // Default fallback
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = getFallbackImage(event.fields.Category);
  };

  const handleSignUp = () => {
    if (selectedPriority === '') {
      alert('Please select a priority before signing up');
      return;
    }
    onSignUp(selectedPriority as number);
  };

  const bannerUrl = event.fields.BannerUrl?.Url || getFallbackImage(event.fields.Category);

  return (
    <div className={`event-card ${isRegistered ? 'registered' : ''}`}>
      <div className="event-banner">
        <img 
          src={bannerUrl} 
          alt={event.fields.Title}
          onError={handleImageError}
        />
      </div>
      <div className="event-header">
        <h3>{event.fields.Title}</h3>
        {isRegistered && <span className="registered-badge">✓ Registered</span>}
      </div>
      <div className="event-category">
        <span className="category-badge">{event.fields.Category}</span>
      </div>
      <p className="event-description">{stripHtml(event.fields.Description).substring(0, 200)}...</p>
      <div className="event-details">
        <div className="event-detail">
          <span className="detail-label">📅 Start:</span>
          <span>{formatDate(event.fields.EventDate)}</span>
        </div>
        <div className="event-detail">
          <span className="detail-label">⏰ End:</span>
          <span>{formatDate(event.fields.EndDate)}</span>
        </div>
        <div className="event-detail">
          <span className="detail-label">📍 Location:</span>
          <span>{event.fields.Location}</span>
        </div>
      </div>
      
      {!isRegistered && (
        <div className="priority-section">
          <label className="priority-label">Priority</label>
          <select 
            value={selectedPriority} 
            onChange={(e) => setSelectedPriority(e.target.value === '' ? '' : parseInt(e.target.value))}
            className="priority-dropdown"
          >
            <option value="">Select priority...</option>
            {Array.from({ length: categoryEventCount }, (_, i) => i + 1).map(num => (
              <option key={num} value={num}>
                Priority {num}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="event-actions">
        {isRegistered ? (
          <button onClick={onDropOut} className="button button-secondary">
            Drop Out
          </button>
        ) : (
          <button 
            onClick={handleSignUp} 
            className="button button-primary"
            disabled={selectedPriority === ''}
          >
            Sign Up
          </button>
        )}
        <Link to={`/event/${event.id}`} className="button button-link">
          View Details
        </Link>
      </div>
    </div>
  );
};
