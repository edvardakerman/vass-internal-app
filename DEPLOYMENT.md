# Azure Deployment Guide

This guide walks you through deploying the Internal Activities application to Azure, including Azure Functions, Storage Account, and Static Web App.

## Prerequisites

- Azure CLI installed (`brew install azure-cli` on macOS)
- Azure subscription
- Node.js and npm installed
- Git repository (optional, for automated deployment)

## Step 1: Login to Azure

```bash
az login
```

Select your subscription:
```bash
az account set --subscription "Your Subscription Name"
```

## Step 2: Create Resource Group

```bash
az group create \
  --name rg-internal-activities \
  --location westeurope
```

## Step 3: Create Storage Account

### Create the Storage Account

```bash
az storage account create \
  --name stinternalactivities \
  --resource-group rg-internal-activities \
  --location westeurope \
  --sku Standard_LRS \
  --kind StorageV2
```

> **Note**: Storage account names must be globally unique and lowercase. Change `stinternalactivities` if needed.

### Get Connection String

```bash
az storage account show-connection-string \
  --name stinternalactivities \
  --resource-group rg-internal-activities \
  --query connectionString \
  --output tsv
```

**Save this connection string** - you'll need it for the Functions App.

### Create Table

```bash
az storage table create \
  --name EventRegistrations \
  --account-name stinternalactivities
```

## Step 4: Deploy Azure Functions

### Create Function App

```bash
az functionapp create \
  --name func-internal-activities \
  --resource-group rg-internal-activities \
  --storage-account stinternalactivities \
  --consumption-plan-location westeurope \
  --runtime node \
  --runtime-version 18 \
  --functions-version 4 \
  --os-type Linux
```

### Configure Function App Settings

```bash
# Add Storage connection string
az functionapp config appsettings set \
  --name func-internal-activities \
  --resource-group rg-internal-activities \
  --settings "AZURE_STORAGE_CONNECTION_STRING=<YOUR_CONNECTION_STRING>"

# Add Table name
az functionapp config appsettings set \
  --name func-internal-activities \
  --resource-group rg-internal-activities \
  --settings "TABLE_NAME=EventRegistrations"
```

Replace `<YOUR_CONNECTION_STRING>` with the connection string from Step 3.

### Enable CORS

```bash
az functionapp cors add \
  --name func-internal-activities \
  --resource-group rg-internal-activities \
  --allowed-origins "*"
```

For production, replace `*` with your Static Web App URL.

### Deploy Functions Code

From the backend directory:

```bash
cd backend
npm run build
func azure functionapp publish vass-internal-func
```

After deployment, note the **Function App URL** (e.g., `https://func-internal-activities.azurewebsites.net`)

## Step 5: Deploy Static Web App (Frontend)

### Option A: Using Azure CLI

```bash
az staticwebapp create \
  --name swa-internal-activities \
  --resource-group rg-internal-activities \
  --location westeurope \
  --sku Free
```

Get the deployment token:

```bash
az staticwebapp secrets list \
  --name swa-internal-activities \
  --resource-group rg-internal-activities \
  --query "properties.apiKey" \
  --output tsv
```

### Build Frontend

Update `frontend/.env` with production values:

```env
VITE_TENANT_ID=your-tenant-id
VITE_CLIENT_ID=your-client-id
VITE_API_BASE_URL=https://func-internal-activities.azurewebsites.net/api
VITE_USE_MOCK_DATA=false
```

Build the frontend:

```bash
cd frontend
npm run build
```

### Deploy Frontend

Install Static Web Apps CLI:

```bash
npm install -g @azure/static-web-apps-cli
```

Deploy:

```bash
swa deploy ./dist \
  --deployment-token <YOUR_DEPLOYMENT_TOKEN> \
  --env production
```

### Option B: Using GitHub Actions (Recommended)

1. **Push code to GitHub**

2. **Connect GitHub to Static Web App**:

```bash
az staticwebapp create \
  --name swa-internal-activities \
  --resource-group rg-internal-activities \
  --location westeurope \
  --source https://github.com/YOUR_USERNAME/YOUR_REPO \
  --branch main \
  --app-location "/frontend" \
  --output-location "dist" \
  --sku Free
```

Azure will automatically create a GitHub Actions workflow that:
- Builds your frontend
- Deploys to Static Web App
- Runs on every push to main branch

## Step 6: Configure Azure AD Redirect URIs

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Select your app registration
4. Go to **Authentication**
5. Add a new **Single-page application** redirect URI:
   - Get your Static Web App URL: `https://swa-internal-activities-xxx.azurestaticapps.net`
   - Add it as a redirect URI
6. **Save**

## Step 7: Update Frontend Environment Variables

In your Static Web App configuration:

```bash
az staticwebapp appsettings set \
  --name swa-internal-activities \
  --resource-group rg-internal-activities \
  --setting-names \
    VITE_TENANT_ID=your-tenant-id \
    VITE_CLIENT_ID=your-client-id \
    VITE_API_BASE_URL=https://func-internal-activities.azurewebsites.net/api \
    VITE_USE_MOCK_DATA=false
```

## Step 8: Verify Deployment

### Test Functions

```bash
curl https://func-internal-activities.azurewebsites.net/api/events
```

### Test Static Web App

Open your browser to: `https://swa-internal-activities-xxx.azurestaticapps.net`

- Sign in with Microsoft
- View events
- Test sign-up/drop-out functionality

## Production Checklist

- [ ] Storage account created with table
- [ ] Function App deployed and configured
- [ ] Static Web App deployed
- [ ] CORS configured correctly (use specific domain, not `*`)
- [ ] Azure AD redirect URIs updated
- [ ] Environment variables set correctly
- [ ] HTTPS enabled (automatic for Azure)
- [ ] Test all functionality

## Cost Optimization

- **Storage Account**: ~$0.01-0.10/month (very low with table storage)
- **Functions**: Consumption plan = Free for first 1M executions/month
- **Static Web App**: Free tier includes 100GB bandwidth/month

Total estimated cost: **$0-5/month** for development/small usage

## Troubleshooting

### Functions not working

Check logs:
```bash
func azure functionapp logstream func-internal-activities
```

### CORS errors

Make sure CORS is configured:
```bash
az functionapp cors show \
  --name func-internal-activities \
  --resource-group rg-internal-activities
```

### Static Web App not loading

Check build output and logs in Azure Portal under:
- Static Web App > Deployment history

### Authentication issues

Verify:
1. Redirect URIs are correct in Azure AD
2. Tenant ID and Client ID are correct in environment variables
3. User has permissions to sign in

## Clean Up Resources

To delete everything:

```bash
az group delete --name rg-internal-activities --yes --no-wait
```

## Next Steps

1. **Set up CI/CD**: Use GitHub Actions for automated deployments
2. **Add Application Insights**: Monitor function performance
3. **Configure Custom Domain**: Add your own domain to Static Web App
4. **Add Authentication**: Configure Static Web App authentication
5. **Graph API Integration**: Replace mock data with real Microsoft Graph API calls

## Useful Commands

### View Function logs
```bash
az functionapp log tail \
  --name func-internal-activities \
  --resource-group rg-internal-activities
```

### View Static Web App details
```bash
az staticwebapp show \
  --name swa-internal-activities \
  --resource-group rg-internal-activities
```

### List all resources
```bash
az resource list \
  --resource-group rg-internal-activities \
  --output table
```

## Support

- Azure Functions: https://learn.microsoft.com/azure/azure-functions/
- Static Web Apps: https://learn.microsoft.com/azure/static-web-apps/
- Azure Storage: https://learn.microsoft.com/azure/storage/

---

**Deployment Time**: ~15-20 minutes

**Difficulty**: Intermediate
