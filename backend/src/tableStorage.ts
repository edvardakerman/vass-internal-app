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
  action: 'signup' | 'dropout'
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

  // Filter only active signups (where latest action is 'signup')
  return Array.from(latestByEvent.values()).filter(e => e.action === 'signup');
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

  // Filter only active signups
  return Array.from(latestByUser.values()).filter(e => e.action === 'signup');
};
