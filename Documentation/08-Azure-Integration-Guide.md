# Azure Integration Guide

This guide explains how to integrate Azure Document Intelligence with your TaskMaster app while keeping Supabase for data storage.

## Why Use Azure Document Intelligence?

- **No Rate Limits**: Unlike Gemini's free tier, Azure has generous quotas
- **Better Structure Extraction**: Excellent for forms, invoices, and structured documents
- **Enterprise Ready**: Production-grade reliability and SLAs
- **Cost Effective**: Pay-per-use pricing, often cheaper than alternatives at scale

## Architecture

```
┌─────────────┐
│   Next.js   │
│   (Vercel/  │
│   Azure)    │
└──────┬──────┘
       │
       ├──► Supabase (Database + Storage)
       │    - User data
       │    - File storage
       │    - Auth
       │
       └──► Azure Document Intelligence
            - Document analysis
            - Text extraction
            - Structure recognition
```

**Key Point**: You keep Supabase for everything except document processing. Azure only processes documents and returns structured data.

## Setup Steps

### 1. Create Azure Document Intelligence Resource

1. Go to [Azure Portal](https://portal.azure.com)
2. Search for "Document Intelligence" (or "Form Recognizer")
3. Click "Create"
4. Choose:
   - **Resource Group**: Create new or use existing
   - **Region**: Choose closest to your users (e.g., `eastus2`)
   - **Pricing Tier**: Start with "Free" (500 pages/month) or "Standard"
5. Click "Review + Create" → "Create"
6. Once created, go to "Keys and Endpoint"
7. Copy:
   - **Endpoint** (e.g., `https://your-resource.cognitiveservices.azure.com/`)
   - **Key 1** or **Key 2**

### 2. Install Azure SDK

```bash
cd taskmaster-client
npm install @azure/ai-document-intelligence
```

### 3. Add Environment Variables

Add to your `.env.local` (and Azure/Vercel environment variables):

```env
# Azure Document Intelligence
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AZURE_DOCUMENT_INTELLIGENCE_KEY=your-key-here
```

### 4. Update Resource Service (Optional)

You can make Azure the default or add a toggle. Update `resourceService.ts`:

```typescript
// Option 1: Use Azure by default
async triggerProcessing(resourceId: string, userId: string, fileUrl: string, classId?: string): Promise<void> {
  try {
    const response = await fetch('/api/documents/analyze-azure', { // Changed endpoint
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resource_id: resourceId,
        user_id: userId,
        file_url: fileUrl,
        class_id: classId,
      }),
    });
    // ... rest of code
  }
}

// Option 2: Add provider selection
async triggerProcessing(
  resourceId: string, 
  userId: string, 
  fileUrl: string, 
  classId?: string,
  provider: 'gemini' | 'azure' = 'azure' // Default to Azure
): Promise<void> {
  const endpoint = provider === 'azure' 
    ? '/api/documents/analyze-azure'
    : '/api/documents/analyze';
  // ... rest of code
}
```

## API Endpoints

### Azure Document Analysis
- **Endpoint**: `POST /api/documents/analyze-azure`
- **Body**: Same as Gemini endpoint
- **Returns**: Same structure as Gemini (for compatibility)

### Comparison

| Feature | Gemini | Azure |
|---------|--------|-------|
| Rate Limits | Free tier: Very low | Free tier: 500 pages/month |
| Cost | Free (limited) | Pay-per-use after free tier |
| Accuracy | Good for general docs | Excellent for structured docs |
| Speed | Fast | Fast |
| Setup | API key only | Resource + endpoint + key |

## Deployment to Azure Static Web Apps

### Option 1: Deploy from GitHub (Recommended)

1. **Push your code to GitHub** (if not already)
2. **Create Static Web App**:
   - Go to Azure Portal
   - Search "Static Web Apps"
   - Click "Create"
   - Select your GitHub repo
   - Choose branch (usually `main` or `master`)
   - **Build Presets**: Select "Next.js"
   - Azure will auto-detect:
     - Build command: `npm run build`
     - App location: `taskmaster-client`
     - Output location: `.next`
3. **Add Environment Variables**:
   - Go to your Static Web App → Configuration
   - Add all your environment variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_KEY`
     - `GEMINI_API_KEY` (if still using)
     - `AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT`
     - `AZURE_DOCUMENT_INTELLIGENCE_KEY`
4. **Deploy**: Azure will automatically deploy on every push

### Option 2: Deploy from Vercel to Azure

If you want to migrate from Vercel:

1. **Export Environment Variables from Vercel**:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Copy all variables

2. **Create Azure Static Web App** (same as above)

3. **Import Environment Variables**:
   - Paste all variables into Azure Static Web App Configuration

4. **Update Domain** (if needed):
   - Azure Static Web App → Custom domains
   - Add your custom domain

### Option 3: Azure Functions for API Routes

If your API routes are complex, you can deploy them separately as Azure Functions:

1. **Create Function App**:
   ```bash
   az functionapp create \
     --resource-group your-resource-group \
     --consumption-plan-location eastus \
     --runtime node \
     --functions-version 4 \
     --name your-function-app \
     --storage-account your-storage-account
   ```

2. **Deploy Functions**:
   - Use [Azure Functions Core Tools](https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local)
   - Or use VS Code Azure Functions extension

## Cost Comparison

### Gemini (Free Tier)
- **Requests**: Very limited (hitting rate limits)
- **Cost**: Free but unreliable for production

### Azure Document Intelligence
- **Free Tier**: 500 pages/month
- **Standard Tier**: ~$1.50 per 1,000 pages
- **No rate limits** (within quota)

### Recommendation
- **Development**: Use Azure free tier
- **Production**: Use Azure Standard tier (very affordable)
- **Hybrid**: Use Azure for document processing, Gemini for chat/assistant features

## Testing

1. **Test Azure Endpoint**:
   ```bash
   curl -X POST http://localhost:3000/api/documents/analyze-azure \
     -H "Content-Type: application/json" \
     -d '{
       "resource_id": "test-id",
       "user_id": "test-user",
       "file_url": "https://example.com/syllabus.pdf"
     }'
   ```

2. **Check Logs**:
   - Azure Portal → Your Static Web App → Log stream
   - Or use Azure CLI: `az webapp log tail --name your-app-name`

## Troubleshooting

### "Azure Document Intelligence not configured"
- Check environment variables are set
- Restart your dev server after adding `.env.local`

### "Failed to analyze document"
- Check Azure resource is active
- Verify endpoint URL is correct (should end with `/`)
- Check key is valid in Azure Portal

### Deployment Issues
- Make sure `package.json` includes `@azure/ai-document-intelligence`
- Check build logs in Azure Portal
- Verify environment variables are set in Azure (not just `.env.local`)

## Next Steps

1. ✅ Set up Azure Document Intelligence resource
2. ✅ Install SDK and add environment variables
3. ✅ Test with `/api/documents/analyze-azure`
4. ✅ Update `resourceService.ts` to use Azure (or add toggle)
5. ✅ Deploy to Azure Static Web Apps
6. ✅ Monitor usage in Azure Portal

## Resources

- [Azure Document Intelligence Docs](https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/)
- [Azure Static Web Apps Docs](https://learn.microsoft.com/en-us/azure/static-web-apps/)
- [Azure Pricing Calculator](https://azure.microsoft.com/en-us/pricing/calculator/)
