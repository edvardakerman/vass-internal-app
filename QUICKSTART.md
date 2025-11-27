# Quick Start Guide

## What You Need to Do Now

### 1. Create Azure AD App Registration

1. Go to https://portal.azure.com
2. Search for "Azure Active Directory"
3. Go to **App registrations** > **New registration**
4. Fill in:
   - **Name**: vass-internal-activities
   - **Supported account types**: "Accounts in this organizational directory only" (or "Personal Microsoft accounts" for personal tenant)
   - **Redirect URI**: 
     - Platform: Single-page application (SPA)
     - URL: `http://localhost:5173`
5. Click **Register**
6. **Save these values** (you'll need them):
   - Application (client) ID: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - Directory (tenant) ID: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### 2. Configure API Permissions

1. In your app registration, go to **API permissions**
2. Click **Add a permission** > **Microsoft Graph** > **Delegated permissions**
3. Add:
   - `User.Read` (should already be there)
   - `Calendars.Read` (for future Graph API integration)
4. Click **Grant admin consent** (if you have admin rights)

### 3. Update Frontend Configuration

```bash
cd frontend
```

Edit the `.env` file and replace:
```
VITE_TENANT_ID=your-tenant-id-here
VITE_CLIENT_ID=your-client-id-here
```

With your actual IDs from step 1.

### 4. Install Azurite (Local Storage Emulator)

```bash
npm install -g azurite
```

## Running the Application

### Terminal 1: Start Azurite
```bash
azurite --silent --location ./azurite --debug ./azurite/debug.log
```

### Terminal 2: Start Backend
```bash
cd backend
npm start
```

### Terminal 3: Start Frontend
```bash
cd frontend
npm run dev
```

Then open http://localhost:5173 in your browser!

## What Works Now

- ✅ Sign in with your Microsoft account
- ✅ View mock events
- ✅ Sign up for events (stored in local Table Storage via Azurite)
- ✅ Drop out from events
- ✅ See your registration status

## Current State

- **Frontend**: Using mock data from `mockEvents.json`
- **Backend**: API endpoints ready and working with local storage
- **Authentication**: Real MSAL authentication (needs your Azure AD app)
- **Storage**: Using Azurite for local development

## Next Steps (When Ready)

1. **Switch to Real Graph API**: Set `VITE_USE_MOCK_DATA=false` and implement Graph API calls in backend
2. **Deploy to Azure**: Follow deployment instructions in main README.md
3. **Add Features**: Event creation, admin dashboard, email notifications, etc.

## Troubleshooting

**"Failed to fetch events"**: Make sure backend is running on port 7071

**MSAL errors**: Double-check your tenant ID and client ID in `.env`

**Storage errors**: Ensure Azurite is running before starting the backend

**CORS issues**: Should be configured, but if issues persist, check `backend/local.settings.json`
