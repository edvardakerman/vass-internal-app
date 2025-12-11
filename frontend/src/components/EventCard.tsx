import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SharePointEvent } from '../types';

interface EventCardProps {
  event: SharePointEvent;
  isRegistered: boolean;
  onSignUp: (priority?: number) => void;
  onDropOut: () => void;
  categoryEventCount: number;
  selectedPriority?: number | null;
  usedPriorities?: number[];
}

export const EventCard = ({ event, isRegistered, onSignUp, onDropOut, categoryEventCount, selectedPriority: selectedPriorityProp = null, usedPriorities = [] }: EventCardProps) => {
  const navigate = useNavigate();
  const [selectedPriority, setSelectedPriority] = useState<number | ''>(selectedPriorityProp ?? '');

  const formatDateRange = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    // Example: Wed, Dec 10, 01:00-02:00 PM
    const datePart = s.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const startTime = s.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const endTime = e.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    // If both times share AM/PM, show single AM/PM at end; keep simple consistent format
    return `${datePart}, ${startTime}-${endTime}`;
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

  const handleSignUp = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedPriority === '') {
      alert('Please select a priority before signing up');
      return;
    }
    onSignUp(selectedPriority as number);
  };

  const bannerUrl = event.fields.BannerUrl?.Url || getFallbackImage(event.fields.Category);

  const openDetails = () => {
    navigate(`/event/${event.id}`);
  };

  return (
    <div role="button" tabIndex={0} onClick={openDetails} className={`event-card ${isRegistered ? 'registered' : ''}`} onKeyDown={(e) => { if (e.key === 'Enter') openDetails(); }}>
      <div className="event-banner">
        <img 
          src={bannerUrl} 
          alt={event.fields.Title}
          onError={handleImageError}
        />
      </div>
      <div className="event-header">
        <h3>{event.fields.Title}</h3>
        {isRegistered && (
          <>
            <span className="registered-badge">✓ Registered</span>
            {selectedPriorityProp != null && (
              <span className="priority-badge">Priority {selectedPriorityProp}</span>
            )}
          </>
        )}
      </div>
      <div className="event-category">
        <span className="category-badge">{event.fields.Category}</span>
      </div>
      <p className="event-description">{stripHtml(event.fields.Description).substring(0, 160)}...</p>
      <div className="event-details">
        <div className="event-detail">
          <span className="detail-label">
            {/* calendar icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M7 10H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 7V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 3V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 3V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span>{formatDateRange(event.fields.EventDate, event.fields.EndDate)}</span>
        </div>
        <div className="event-detail">
          <span className="detail-label">
            {/* location icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M12 11.5C13.3807 11.5 14.5 10.3807 14.5 9C14.5 7.61929 13.3807 6.5 12 6.5C10.6193 6.5 9.5 7.61929 9.5 9C9.5 10.3807 10.6193 11.5 12 11.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M17.657 16.657C15.4862 18.8278 12.5138 18.8278 10.343 16.657C8.1722 14.4862 8.1722 11.5138 10.343 9.34302C12.5138 7.1722 15.4862 7.1722 17.657 9.34302C19.8278 11.5138 19.8278 14.4862 17.657 16.657Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span>{event.fields.Location}</span>
        </div>
      </div>
      
      {!isRegistered && (
        <div className="priority-section" onClick={(e) => e.stopPropagation()}>
          <label className="priority-label">Priority</label>
          <select 
            value={selectedPriority} 
            onChange={(e) => setSelectedPriority(e.target.value === '' ? '' : parseInt(e.target.value))}
            className="priority-dropdown"
            onClick={(e) => e.stopPropagation()}
          >
            <option value="">Select priority...</option>
            {Array.from({ length: categoryEventCount }, (_, i) => i + 1).map(num => (
              <option key={num} value={num} disabled={usedPriorities?.includes(num) && num !== selectedPriority}>
                Priority {num}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="event-actions">
        {isRegistered ? (
          <button onClick={(e) => { e.stopPropagation(); onDropOut(); }} className="button button-secondary">
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
      </div>
    </div>
  );
};
