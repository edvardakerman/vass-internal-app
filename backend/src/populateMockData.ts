import { TableClient } from '@azure/data-tables';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const tableName = process.env.TABLE_NAME || 'EventRegistrations';

interface MockRegistration {
  eventId: string;
  eventTitle: string;
  userId: string;
  userEmail: string;
  action: 'signup' | 'waitlist';
  daysAgo: number;
}

// Mock users
const mockUsers = [
  { id: 'user001', email: 'anna.andersson@vass.se' },
  { id: 'user002', email: 'erik.eriksson@vass.se' },
  { id: 'user003', email: 'maria.nilsson@vass.se' },
  { id: 'user004', email: 'johan.svensson@vass.se' },
  { id: 'user005', email: 'sara.larsson@vass.se' },
  { id: 'user006', email: 'anders.persson@vass.se' },
  { id: 'user007', email: 'karin.gustafsson@vass.se' },
  { id: 'user008', email: 'mikael.johansson@vass.se' },
  { id: 'user009', email: 'linda.olsson@vass.se' },
  { id: 'user010', email: 'peter.hansson@vass.se' },
  { id: 'user011', email: 'emma.holm@vass.se' },
  { id: 'user012', email: 'david.berg@vass.se' },
  { id: 'user013', email: 'lisa.lundgren@vass.se' },
  { id: 'user014', email: 'daniel.karlsson@vass.se' },
  { id: 'user015', email: 'sofia.lindberg@vass.se' },
  { id: 'user016', email: 'marcus.forsberg@vass.se' },
  { id: 'user017', email: 'helena.sjöberg@vass.se' },
  { id: 'user018', email: 'robert.engström@vass.se' },
];

// Mock registrations - Create full event and waitlist for Crossfit
const mockRegistrations: MockRegistration[] = [
  // Crossfit (15 seats) - FULL + waitlist
  ...Array.from({ length: 15 }, (_, i) => ({
    eventId: '62',
    eventTitle: 'Funktionell träning - Crossfit',
    userId: mockUsers[i].id,
    userEmail: mockUsers[i].email,
    action: 'signup' as const,
    daysAgo: 10 - i,
  })),
  // Waitlist for Crossfit
  { eventId: '62', eventTitle: 'Funktionell träning - Crossfit', userId: mockUsers[15].id, userEmail: mockUsers[15].email, action: 'waitlist', daysAgo: 1 },
  { eventId: '62', eventTitle: 'Funktionell träning - Crossfit', userId: mockUsers[16].id, userEmail: mockUsers[16].email, action: 'waitlist', daysAgo: 0.5 },
  { eventId: '62', eventTitle: 'Funktionell träning - Crossfit', userId: mockUsers[17].id, userEmail: mockUsers[17].email, action: 'waitlist', daysAgo: 0.25 },

  // Yoga (12 seats) - 7 signups
  { eventId: '73', eventTitle: 'Yoga & Mindfulness', userId: mockUsers[0].id, userEmail: mockUsers[0].email, action: 'signup', daysAgo: 8 },
  { eventId: '73', eventTitle: 'Yoga & Mindfulness', userId: mockUsers[1].id, userEmail: mockUsers[1].email, action: 'signup', daysAgo: 7 },
  { eventId: '73', eventTitle: 'Yoga & Mindfulness', userId: mockUsers[2].id, userEmail: mockUsers[2].email, action: 'signup', daysAgo: 6 },
  { eventId: '73', eventTitle: 'Yoga & Mindfulness', userId: mockUsers[3].id, userEmail: mockUsers[3].email, action: 'signup', daysAgo: 5 },
  { eventId: '73', eventTitle: 'Yoga & Mindfulness', userId: mockUsers[4].id, userEmail: mockUsers[4].email, action: 'signup', daysAgo: 4 },
  { eventId: '73', eventTitle: 'Yoga & Mindfulness', userId: mockUsers[5].id, userEmail: mockUsers[5].email, action: 'signup', daysAgo: 3 },
  { eventId: '73', eventTitle: 'Yoga & Mindfulness', userId: mockUsers[6].id, userEmail: mockUsers[6].email, action: 'signup', daysAgo: 2 },

  // Christmas Party (80 seats) - 25 signups
  ...Array.from({ length: 25 }, (_, i) => ({
    eventId: '84',
    eventTitle: 'Julafton Firande 2025',
    userId: mockUsers[i % mockUsers.length].id,
    userEmail: mockUsers[i % mockUsers.length].email,
    action: 'signup' as const,
    daysAgo: 15 - (i * 0.5),
  })),

  // Tech Talk (25 seats) - 10 signups
  ...Array.from({ length: 10 }, (_, i) => ({
    eventId: '95',
    eventTitle: 'Tech Talk: Azure & AI',
    userId: mockUsers[i].id,
    userEmail: mockUsers[i].email,
    action: 'signup' as const,
    daysAgo: 5 - (i * 0.3),
  })),
];

async function populateMockData() {
  console.log('Connecting to Azure Table Storage...');
  const tableClient = TableClient.fromConnectionString(connectionString, tableName);

  try {
    // Ensure table exists
    await tableClient.createTable();
    console.log(`Table '${tableName}' is ready`);
  } catch (error: any) {
    if (error.statusCode !== 409) {
      throw error;
    }
  }

  console.log(`\nAdding ${mockRegistrations.length} mock registrations...`);

  for (const reg of mockRegistrations) {
    const timestamp = new Date();
    timestamp.setDate(timestamp.getDate() - reg.daysAgo);
    
    const rowKey = `${reg.userId}_${timestamp.getTime()}`;

    const entity = {
      partitionKey: reg.eventId,
      rowKey: rowKey,
      userId: reg.userId,
      userEmail: reg.userEmail,
      eventId: reg.eventId,
      eventTitle: reg.eventTitle,
      action: reg.action,
      timestamp: timestamp.toISOString(),
    };

    try {
      await tableClient.createEntity(entity);
      console.log(`✓ Added ${reg.action} for ${reg.userEmail} to ${reg.eventTitle}`);
    } catch (error: any) {
      if (error.statusCode === 409) {
        console.log(`  Skipped (already exists): ${reg.userEmail}`);
      } else {
        console.error(`  Error adding ${reg.userEmail}:`, error.message);
      }
    }
  }

  console.log('\n✅ Mock data population complete!');
  console.log('\nSummary:');
  console.log('- Crossfit: 15/15 seats + 3 on waitlist');
  console.log('- Yoga: 7/12 seats');
  console.log('- Christmas Party: 25/80 seats');
  console.log('- Tech Talk: 10/25 seats');
}

populateMockData().catch(console.error);
