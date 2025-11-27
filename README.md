# VASS Internal Activities

Event registration system with Microsoft SSO authentication and Azure backend.

## Project Structure

- **frontend/** - React + TypeScript + MSAL frontend
- **backend/** - Azure Functions + TypeScript backend

## Prerequisites

- Node.js (v18+)
- Azure Functions Core Tools (`npm install -g azure-functions-core-tools@4`)
- Azurite (for local storage emulation): `npm install -g azurite`
- Azure subscription (for production deployment)

## Setup

### 1. Azure AD App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
   - Name: `vass-internal-activities`
   - Supported account types: Choose based on your needs
   - Redirect URI: `Single-page application (SPA)` - `http://localhost:5173`
4. After creation, note down:
   - **Application (client) ID**
   - **Directory (tenant) ID**
5. Under **API permissions**, add:
   - `User.Read`
   - `Calendars.Read` (for Graph API access later)
6. Grant admin consent for your organization

### 2. Frontend Configuration

```bash
cd frontend
cp .env.example .env
```

Edit `.env`:
```
VITE_TENANT_ID=your-tenant-id-here
VITE_CLIENT_ID=your-client-id-here
VITE_API_BASE_URL=http://localhost:7071/api
VITE_USE_MOCK_DATA=true
```

### 3. Backend Configuration

The backend is already configured to use local storage emulation.

For production, update `backend/local.settings.json` or set Azure App Settings:
```json
{
  "AZURE_STORAGE_CONNECTION_STRING": "your-connection-string",
  "TABLE_NAME": "EventRegistrations"
}
```

## Running Locally

### 1. Start Azurite (local storage emulator)

```bash
azurite --silent --location ./azurite --debug ./azurite/debug.log
```

### 2. Start Backend

```bash
cd backend
npm install
npm start
```

Backend will run on `http://localhost:7071`

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on `http://localhost:5173`

## Features

- ✅ Microsoft SSO authentication via MSAL
- ✅ Event listing (currently using mock data)
- ✅ Sign up for events
- ✅ Drop out from events
- ✅ Registration tracking in Azure Table Storage
- ✅ User-specific registration state

## Mock Data vs Real Graph API

Currently using mock data (`VITE_USE_MOCK_DATA=true`). To switch to real Graph API:

1. Ensure you have Graph API permissions configured
2. Update `backend/src/functions/getEvents.ts` to call Microsoft Graph API
3. Set `VITE_USE_MOCK_DATA=false` in frontend `.env`

## Azure Deployment

### Backend Deployment

```bash
cd backend
func azure functionapp publish <YOUR_FUNCTION_APP_NAME>
```

### Frontend Deployment

Build and deploy to Azure Static Web Apps or App Service:

```bash
cd frontend
npm run build
# Upload dist/ folder to your hosting service
```

Update frontend `.env` with production URLs.

## Storage Schema

**Table Name:** `EventRegistrations`

| Field | Type | Description |
|-------|------|-------------|
| partitionKey | string | Event ID |
| rowKey | string | userId_timestamp |
| userId | string | User identifier |
| userEmail | string | User email |
| eventId | string | Event identifier |
| eventTitle | string | Event subject |
| action | string | 'signup' or 'dropout' |
| timestamp | string | ISO timestamp |

## Next Steps

- [ ] Integrate real Microsoft Graph API for events
- [ ] Add authentication middleware to Azure Functions
- [ ] Add event attendee count display
- [ ] Add email notifications
- [ ] Add admin dashboard for event management
- [ ] Add event creation functionality

## Troubleshooting

**CORS issues**: Make sure `local.settings.json` has `"Host": { "CORS": "*" }`

**Storage connection**: Ensure Azurite is running before starting the backend

**Authentication errors**: Verify your tenant ID and client ID in `.env`

## License

ISC
