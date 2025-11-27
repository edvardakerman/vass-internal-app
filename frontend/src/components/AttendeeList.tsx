import { useEffect, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import type { EventAttendee } from '../types';
import { getEventAttendees } from '../api';
import { loginRequest } from '../authConfig';
import './AttendeeList.css';

interface AttendeeListProps {
  eventId: string;
  maxSeats?: number;
}

export function AttendeeList({ eventId, maxSeats }: AttendeeListProps) {
  const { instance, accounts } = useMsal();
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [waitlist, setWaitlist] = useState<EventAttendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAttendees();
  }, [eventId]);

  const loadAttendees = async () => {
    try {
      setLoading(true);
      setError(null);

      const request = {
        ...loginRequest,
        account: accounts[0],
      };

      const response = await instance.acquireTokenSilent(request);
      const data = await getEventAttendees(eventId, response.accessToken);
      setAttendees(data.attendees);
      setWaitlist(data.waitlist);
    } catch (err) {
      setError('Failed to load attendees');
      console.error('Error loading attendees:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="attendee-list">
        <h3>Attendees</h3>
        <p className="loading">Loading attendees...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="attendee-list">
        <h3>Attendees</h3>
        <p className="error">{error}</p>
      </div>
    );
  }

  return (
    <div className="attendee-list">
      <h3>
        Attendees ({attendees.length}
        {maxSeats ? ` / ${maxSeats}` : ''})
      </h3>
      {attendees.length === 0 ? (
        <p className="empty-state">No one has signed up yet. Be the first!</p>
      ) : (
        <ul className="attendee-items">
          {attendees.map((attendee) => (
            <li key={attendee.userId} className="attendee-item">
              <div className="attendee-info">
                <span className="attendee-name">
                  {attendee.userName || attendee.userEmail}
                </span>
                <span className="attendee-date">
                  Signed up on {new Date(attendee.signupDate).toLocaleDateString()}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {waitlist.length > 0 && (
        <>
          <h3 className="waitlist-header">Waitlist ({waitlist.length})</h3>
          <ul className="attendee-items waitlist-items">
            {waitlist.map((person, index) => (
              <li key={person.userId} className="attendee-item waitlist-item">
                <div className="attendee-info">
                  <span className="attendee-name">
                    #{index + 1} - {person.userName || person.userEmail}
                  </span>
                  <span className="attendee-date">
                    Joined waitlist on {new Date(person.signupDate).toLocaleDateString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
