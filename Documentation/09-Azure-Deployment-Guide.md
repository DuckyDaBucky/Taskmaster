# Deploying TaskMaster from Vercel to Azure

This guide walks you through migrating your Next.js app from Vercel to Azure Static Web Apps.

## Prerequisites

- Azure account ([Free tier available](https://azure.microsoft.com/free/))
- GitHub account (for deployment)
- Your code pushed to GitHub

## Step 1: Prepare Your Repository

1. **Ensure your code is on GitHub**:
   ```bash
   git remote -v  # Check if GitHub remote exists
   # If not, add it:
   git remote add origin https://github.com/yourusername/taskmaster.git
   git push -u origin main
   ```

2. **Verify build works locally**:
   ```bash
   cd taskmaster-client
   npm run build
   ```

## Step 2: Create Azure Static Web App

### Via Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Click "Create a resource"
3. Search for "Static Web App"
4. Click "Create"
5. Fill in:
   - **Subscription**: Your Azure subscription
   - **Resource Group**: Create new (e.g., `taskmaster-rg`)
   - **Name**: `taskmaster-app` (must be globally unique)
   - **Plan type**: Free (or Standard for custom domains)
   - **Region**: Choose closest (e.g., `East US 2`)
   - **Source**: GitHub
   - **GitHub account**: Sign in and authorize
   - **Organization**: Your GitHub username
   - **Repository**: `taskmaster` (or your repo name)
   - **Branch**: `main` (or `master`)
   - **Build Presets**: **Next.js**
   - **App location**: `taskmaster-client`
   - **Api location**: Leave empty (API routes handled automatically)
   - **Output location**: `.next`

6. Click "Review + Create" → "Create"
7. Wait for deployment to start (takes 2-5 minutes)

### Via Azure CLI

```bash
# Install Azure CLI if needed
# https://docs.microsoft.com/en-us/cli/azure/install-azure-cli

# Login
az login

# Create resource group
az group create --name taskmaster-rg --location eastus2

# Create Static Web App
az staticwebapp create \
  --name taskmaster-app \
  --resource-group taskmaster-rg \
  --source https://github.com/yourusername/taskmaster \
  --location eastus2 \
  --branch main \
  --app-location "taskmaster-client" \
  --output-location ".next" \
  --login-with-github
```

## Step 3: Configure Environment Variables

1. **Go to your Static Web App** in Azure Portal
2. **Click "Configuration"** in the left menu
3. **Click "+ Add"** for each environment variable:

### Required Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
GEMINI_API_KEY=your-gemini-key (optional, if using Gemini)
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AZURE_DOCUMENT_INTELLIGENCE_KEY=your-azure-key
```

4. **Click "Save"** after adding all variables

### Copy from Vercel

If you have variables in Vercel:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Copy each variable name and value
3. Paste into Azure Configuration

## Step 4: Verify Deployment

1. **Check deployment status**:
   - Azure Portal → Your Static Web App → "Deployment history"
   - Should show "Succeeded" status

2. **Get your app URL**:
   - Azure Portal → Your Static Web App → "Overview"
   - Copy the "URL" (e.g., `https://taskmaster-app.azurestaticapps.net`)

3. **Test your app**:
   - Visit the URL
   - Try uploading a document
   - Check that API routes work

## Step 5: Custom Domain (Optional)

1. **Go to "Custom domains"** in your Static Web App
2. **Click "Add"**
3. **Enter your domain** (e.g., `taskmaster.com`)
4. **Follow DNS instructions**:
   - Add CNAME record pointing to your Static Web App URL
   - Azure will verify and configure SSL automatically

## Step 6: Monitor and Debug

### View Logs

1. **Azure Portal** → Your Static Web App → "Log stream"
2. Or use Azure CLI:
   ```bash
   az webapp log tail --name taskmaster-app --resource-group taskmaster-rg
   ```

### Check Build Logs

1. **Azure Portal** → Your Static Web App → "Deployment history"
2. Click on a deployment → "View logs"

### Application Insights (Optional)

For advanced monitoring:

1. Create Application Insights resource
2. Link to your Static Web App
3. View metrics, errors, and performance

## Differences from Vercel

| Feature | Vercel | Azure Static Web Apps |
|---------|--------|----------------------|
| **Deployment** | Automatic on push | Automatic on push |
| **Build** | Automatic detection | Manual config (Next.js preset) |
| **API Routes** | Serverless functions | Azure Functions (auto-converted) |
| **Environment Variables** | Per environment | Single set (can use slots) |
| **Custom Domain** | Free SSL | Free SSL |
| **Preview Deploys** | Automatic PR previews | Manual staging slots |
| **Cost** | Free tier available | Free tier available |

## Troubleshooting

### Build Fails

**Error**: "Build command not found"
- **Fix**: Check `package.json` has `build` script
- Verify `app-location` is correct in Azure config

**Error**: "Module not found"
- **Fix**: Ensure `package.json` includes all dependencies
- Check `node_modules` is in `.gitignore` (should be)

### API Routes Not Working

**Issue**: 404 on `/api/*` routes
- **Fix**: API routes are auto-converted to Azure Functions
- Check deployment logs for conversion errors
- Verify environment variables are set

### Environment Variables Not Working

**Issue**: `process.env.VAR` is undefined
- **Fix**: 
  - Restart the app after adding variables
  - Check variable names match exactly (case-sensitive)
  - Verify variables are saved (click "Save" button)

### Slow Deployments

**Issue**: Deployments take 10+ minutes
- **Fix**: This is normal for first deployment
- Subsequent deployments are faster (2-5 minutes)
- Consider using Azure DevOps for faster CI/CD

## Cost Comparison

### Vercel
- **Free**: 100GB bandwidth, unlimited requests
- **Pro**: $20/month, 1TB bandwidth

### Azure Static Web Apps
- **Free**: 100GB storage, 100GB bandwidth
- **Standard**: $9/month, 500GB storage, 500GB bandwidth

**Recommendation**: Both are very affordable. Azure is better if you're already using Azure services (Document Intelligence, etc.).

## Next Steps

1. ✅ Deploy to Azure Static Web Apps
2. ✅ Configure environment variables
3. ✅ Test all features
4. ✅ Set up custom domain (optional)
5. ✅ Monitor usage and costs
6. ✅ Update DNS if migrating from Vercel

## Rollback Plan

If you need to rollback:

1. **Azure**: Go to Deployment history → Select previous deployment → "Redeploy"
2. **Or**: Keep Vercel deployment active until Azure is verified

## Resources

- [Azure Static Web Apps Docs](https://learn.microsoft.com/en-us/azure/static-web-apps/)
- [Next.js on Azure](https://learn.microsoft.com/en-us/azure/static-web-apps/nextjs)
- [Azure Pricing](https://azure.microsoft.com/en-us/pricing/details/app-service/static/)
