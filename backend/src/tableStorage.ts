import { TableClient, AzureNamedKeyCredential } from '@azure/data-tables';
import type { EventRegistrationEntity } from './types';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const tableName = process.env.TABLE_NAME || 'EventRegistrations';

let tableClient: TableClient;

export const getTableClient = (): TableClient => {
  if (!tableClient) {
    tableClient = TableClient.fromConnectionString(connectionString, tableName);
  }
  return tableClient;
};

export const initializeTable = async (): Promise<void> => {
  try {
    const client = getTableClient();
    await client.createTable();
    console.log(`Table '${tableName}' created or already exists`);
  } catch (error: any) {
    if (error.statusCode !== 409) { // 409 means table already exists
      console.error('Error creating table:', error);
      throw error;
    }
  }
};

export const addRegistration = async (
  eventId: string,
  userId: string,
  userEmail: string,
  eventTitle: string,
  action: 'signup' | 'dropout' | 'waitlist'
): Promise<void> => {
  const client = getTableClient();
  const timestamp = new Date().toISOString();
  const rowKey = `${userId}_${Date.now()}`;

  const entity: EventRegistrationEntity = {
    partitionKey: eventId,
    rowKey: rowKey,
    userId,
    userEmail,
    eventId,
    eventTitle,
    action,
    timestamp,
  };

  await client.createEntity(entity);
};

export const getUserRegistrations = async (userId: string): Promise<EventRegistrationEntity[]> => {
  const client = getTableClient();
  const entities: EventRegistrationEntity[] = [];

  // Query all partitions for this user's latest registrations
  const queryFilter = `userId eq '${userId}'`;
  const entitiesIter = client.listEntities<EventRegistrationEntity>({ queryOptions: { filter: queryFilter } });

  for await (const entity of entitiesIter) {
    entities.push(entity);
  }

  // Get the latest action for each event
  const latestByEvent = new Map<string, EventRegistrationEntity>();
  
  entities.forEach(entity => {
    const existing = latestByEvent.get(entity.eventId);
    if (!existing || new Date(entity.timestamp) > new Date(existing.timestamp)) {
      latestByEvent.set(entity.eventId, entity);
    }
  });

  // Filter only active signups (where latest action is 'signup' or 'waitlist')
  return Array.from(latestByEvent.values()).filter(e => e.action === 'signup' || e.action === 'waitlist');
};

export const getEventRegistrations = async (eventId: string): Promise<EventRegistrationEntity[]> => {
  const client = getTableClient();
  const entities: EventRegistrationEntity[] = [];

  const entitiesIter = client.listEntities<EventRegistrationEntity>({
    queryOptions: { filter: `PartitionKey eq '${eventId}'` }
  });

  for await (const entity of entitiesIter) {
    entities.push(entity);
  }

  // Get the latest action for each user
  const latestByUser = new Map<string, EventRegistrationEntity>();
  
  entities.forEach(entity => {
    const existing = latestByUser.get(entity.userId);
    if (!existing || new Date(entity.timestamp) > new Date(existing.timestamp)) {
      latestByUser.set(entity.userId, entity);
    }
  });

  // Filter active signups and waitlist
  return Array.from(latestByUser.values()).filter(e => e.action === 'signup' || e.action === 'waitlist');
};

export const getEventAttendeesWithWaitlist = async (eventId: string): Promise<{
  attendees: EventRegistrationEntity[];
  waitlist: EventRegistrationEntity[];
}> => {
  const allRegistrations = await getEventRegistrations(eventId);
  
  const attendees = allRegistrations
    .filter(e => e.action === 'signup')
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  const waitlist = allRegistrations
    .filter(e => e.action === 'waitlist')
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  return { attendees, waitlist };
};

export const promoteFromWaitlist = async (eventId: string, eventTitle: string): Promise<EventRegistrationEntity | null> => {
  const { waitlist } = await getEventAttendeesWithWaitlist(eventId);
  
  if (waitlist.length === 0) {
    return null;
  }
  
  // Get first person in waitlist
  const nextPerson = waitlist[0];
  
  // Promote them to signup
  await addRegistration(
    eventId,
    nextPerson.userId,
    nextPerson.userEmail,
    eventTitle,
    'signup'
  );
  
  return nextPerson;
};
