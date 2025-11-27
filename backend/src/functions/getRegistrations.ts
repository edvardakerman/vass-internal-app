import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getUserRegistrations } from '../tableStorage';

export async function getRegistrations(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('HTTP trigger function processed a request for getRegistrations');

  try {
    const userId = request.params.userId;

    if (!userId) {
      return {
        status: 400,
        jsonBody: { error: 'Missing userId parameter' },
      };
    }

    const registrations = await getUserRegistrations(userId);

    return {
      status: 200,
      jsonBody: registrations,
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (error) {
    context.error('Error fetching registrations:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to fetch registrations' },
    };
  }
}

app.http('getRegistrations', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'registrations/{userId}',
  handler: getRegistrations,
});
