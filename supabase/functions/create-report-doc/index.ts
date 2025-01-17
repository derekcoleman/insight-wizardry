import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { google } from "npm:googleapis@126";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { report } = await req.json()
    
    if (!report) {
      throw new Error('No report data provided');
    }

    console.log('Initializing Google Drive API with service account');
    const serviceAccount = JSON.parse(Deno.env.get('GOOGLE_SERVICE_ACCOUNT') || '');
    
    if (!serviceAccount.client_email || !serviceAccount.private_key) {
      throw new Error('Invalid service account configuration');
    }

    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    console.log('Creating Google Docs and Drive instances');
    const docs = google.docs({ version: 'v1', auth });
    const drive = google.drive({ version: 'v3', auth });

    console.log('Creating new document');
    const document = await docs.documents.create({
      requestBody: {
        title: `Analytics Report - ${new Date().toLocaleDateString()}`,
      },
    });

    const docId = document.data.documentId;
    if (!docId) throw new Error('Failed to create document');

    console.log('Setting document permissions');
    await drive.permissions.create({
      fileId: docId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Format the content
    const requests = [];
    
    // Add title
    requests.push({
      insertText: {
        location: { index: 1 },
        text: `Analytics Report\n${new Date().toLocaleDateString()}\n\n`,
      },
    });

    let currentIndex = requests[0].insertText.text.length + 1;

    // Function to format numbers
    const formatNumber = (num: number | undefined) => {
      if (num === undefined) return 'N/A';
      return num.toLocaleString();
    };

    // Function to add a section
    const addSection = (title: string, data: any) => {
      if (!data) return currentIndex;

      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: `${title}\n`,
        },
      });
      currentIndex += title.length + 1;

      // Add period information
      if (data.period) {
        requests.push({
          insertText: {
            location: { index: currentIndex },
            text: `Period: ${data.period}\n\n`,
          },
        });
        currentIndex += `Period: ${data.period}\n\n`.length;
      }

      // Add metrics
      if (data.current) {
        const metrics = [
          { label: 'Sessions', value: formatNumber(data.current.sessions), change: data.changes?.sessions },
          { label: 'Conversions', value: formatNumber(data.current.conversions), change: data.changes?.conversions },
          { label: 'Revenue', value: formatNumber(data.current.revenue), change: data.changes?.revenue },
        ];

        metrics.forEach(metric => {
          if (metric.value !== undefined) {
            const text = `${metric.label}: ${metric.value} (${metric.change >= 0 ? '+' : ''}${metric.change}%)\n`;
            requests.push({
              insertText: {
                location: { index: currentIndex },
                text,
              },
            });
            currentIndex += text.length;
          }
        });

        // Add search terms if available
        if (data.searchTerms && data.searchTerms.length > 0) {
          requests.push({
            insertText: {
              location: { index: currentIndex },
              text: '\nTop Search Terms:\n',
            },
          });
          currentIndex += '\nTop Search Terms:\n'.length;

          data.searchTerms.forEach((term: any) => {
            const termText = `${term.term}: ${term.current.clicks} clicks (${term.changes.clicks}% change)\n`;
            requests.push({
              insertText: {
                location: { index: currentIndex },
                text: termText,
              },
            });
            currentIndex += termText.length;
          });
        }
      }

      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: '\n',
        },
      });
      currentIndex += 1;

      return currentIndex;
    };

    console.log('Adding content sections to document');
    // Add each analysis section
    addSection('Weekly Analysis', report.weekly_analysis);
    addSection('Monthly Analysis', report.monthly_analysis);
    addSection('Quarterly Analysis', report.quarterly_analysis);
    addSection('Year to Date Analysis', report.ytd_analysis);
    addSection('Last 28 Days Year over Year Analysis', report.last28_yoy_analysis);

    console.log('Applying updates to document');
    await docs.documents.batchUpdate({
      documentId: docId,
      requestBody: {
        requests,
      },
    });

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
    console.error('Error creating document:', error);
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