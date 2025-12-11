import type { SharePointEvent } from '../types';
import { useNavigate } from 'react-router-dom';

interface Registration {
  eventId: string;
  eventTitle: string;
  priority?: number;
  action: string;
}

interface RegistrationSummaryProps {
  registrations: Registration[];
  events: SharePointEvent[];
}

export const RegistrationSummary = ({ registrations, events }: RegistrationSummaryProps) => {
  const navigate = useNavigate();
  // Filter active registrations (signup or waitlist)
  const activeRegs = registrations.filter(r => r.action === 'signup' || r.action === 'waitlist');
  
  if (activeRegs.length === 0) {
    return null;
  }

  // Categorize registrations
  const healthRegs: Registration[] = [];
  const socialRegs: Registration[] = [];

  activeRegs.forEach(reg => {
    const event = events.find(e => e.id === reg.eventId);
    const category = event?.fields?.Category?.toLowerCase()?.includes('health') ? 'health' : 'social';
    
    if (category === 'health') {
      healthRegs.push(reg);
    } else {
      socialRegs.push(reg);
    }
  });

  // Sort by priority
  healthRegs.sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
  socialRegs.sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));

  const renderCategory = (title: string, regs: Registration[]) => {
    if (regs.length === 0) return null;

    return (
      <div className="summary-category">
        <h3>{title}</h3>
        <div className="summary-events-list">
          {regs.map((reg) => (
            <div key={reg.eventId} className="summary-event-item">
              <span className="summary-event-title" onClick={() => navigate(`/event/${reg.eventId}`)}>
                {reg.eventTitle}
              </span>
              {reg.priority && (
                <span className="summary-priority">Priority {reg.priority}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="registration-summary">
      <div className="summary-header">
        <h2>Your Registrations</h2>
      </div>
      <div className="summary-content">
        {renderCategory('Health Events', healthRegs)}
        {renderCategory('Social Events', socialRegs)}
      </div>
    </div>
  );
};
