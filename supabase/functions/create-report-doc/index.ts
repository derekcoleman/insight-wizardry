import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { google } from "npm:googleapis@126";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { report, insights } = await req.json()
    
    if (!report) {
      throw new Error('No report data provided');
    }

    console.log('Starting document creation process...');
    
    const serviceAccountStr = Deno.env.get('GOOGLE_SERVICE_ACCOUNT');
    if (!serviceAccountStr) {
      throw new Error('Google service account configuration is missing');
    }

    const serviceAccount = JSON.parse(serviceAccountStr);
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/documents']
    });

    const docs = google.docs({ version: 'v1', auth });
    const drive = google.drive({ version: 'v3', auth });

    // Create a new document
    console.log('Creating new document...');
    const document = await docs.documents.create({
      requestBody: {
        title: `Analytics Report - ${new Date().toLocaleDateString()}`,
      },
    });

    const docId = document.data.documentId;
    if (!docId) {
      throw new Error('Failed to create document');
    }

    // Set document permissions
    console.log('Setting document permissions...');
    await drive.permissions.create({
      fileId: docId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Helper function to append text with retry logic
    const appendText = async (text: string, retries = 3, baseDelay = 1000) => {
      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          await docs.documents.batchUpdate({
            documentId: docId,
            requestBody: {
              requests: [{
                insertText: {
                  location: { index: 1 },
                  text: text + '\n'
                }
              }]
            }
          });
          return;
        } catch (error) {
          console.error(`Error on attempt ${attempt + 1}:`, error);
          if (error.code === 429 && attempt < retries - 1) {
            const waitTime = baseDelay * Math.pow(2, attempt); // Exponential backoff
            console.log(`Rate limited. Waiting ${waitTime}ms before retry...`);
            await delay(waitTime);
            continue;
          }
          throw error;
        }
      }
    };

    // Add content with rate limiting
    const addContent = async () => {
      // Title
      await appendText(`Analytics Report - ${new Date().toLocaleDateString()}`);
      await delay(1000); // Basic rate limiting

      // Key Findings
      if (insights) {
        await appendText('\nKey Findings:');
        await delay(1000);
        await appendText(insights);
        await delay(1000);
      }

      // Analysis sections
      const periods = ['weekly', 'monthly', 'quarterly', 'ytd'];
      for (const period of periods) {
        const analysis = report[`${period}_analysis`];
        if (analysis) {
          await appendText(`\n${period.charAt(0).toUpperCase() + period.slice(1)} Analysis`);
          await delay(1000);
          
          await appendText(`Period: ${analysis.period || 'Not specified'}`);
          await delay(1000);

          if (analysis.current) {
            await appendText('\nCurrent Period Metrics:');
            for (const [key, value] of Object.entries(analysis.current)) {
              await appendText(`${key}: ${value}`);
              await delay(1000);
            }
          }

          if (analysis.previous) {
            await appendText('\nPrevious Period Metrics:');
            for (const [key, value] of Object.entries(analysis.previous)) {
              await appendText(`${key}: ${value}`);
              await delay(1000);
            }
          }
        }
      }
    };

    await addContent();
    console.log('Document created successfully');

    return new Response(
      JSON.stringify({
        docUrl: `https://docs.google.com/document/d/${docId}/edit`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error in create-report-doc function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})