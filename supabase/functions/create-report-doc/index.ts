import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { google } from "npm:googleapis@126";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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

    console.log('Setting document permissions...');
    await drive.permissions.create({
      fileId: docId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Create document content
    const requests = [];
    let currentIndex = 1;

    // Add title
    requests.push({
      insertText: {
        location: { index: currentIndex },
        text: `Analytics Report\n${new Date().toLocaleDateString()}\n\n`
      }
    });

    // Format title
    requests.push({
      updateParagraphStyle: {
        range: {
          startIndex: currentIndex,
          endIndex: currentIndex + "Analytics Report".length
        },
        paragraphStyle: {
          namedStyleType: "HEADING_1",
          alignment: "CENTER"
        },
        fields: "namedStyleType,alignment"
      }
    });

    currentIndex += `Analytics Report\n${new Date().toLocaleDateString()}\n\n`.length;

    // Add insights if available
    if (insights) {
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: `AI Analysis\n\n${insights}\n\n`
        }
      });

      // Format insights heading
      requests.push({
        updateParagraphStyle: {
          range: {
            startIndex: currentIndex,
            endIndex: currentIndex + "AI Analysis".length
          },
          paragraphStyle: {
            namedStyleType: "HEADING_2"
          },
          fields: "namedStyleType"
        }
      });

      currentIndex += `AI Analysis\n\n${insights}\n\n`.length;
    }

    // Helper function to create a metrics table
    const createMetricsTable = (title: string, data: any) => {
      if (!data?.current) return [];

      const tableRequests = [];
      
      // Add section title
      tableRequests.push({
        insertText: {
          location: { index: currentIndex },
          text: `${title}\n`
        }
      });

      // Format section title
      tableRequests.push({
        updateParagraphStyle: {
          range: {
            startIndex: currentIndex,
            endIndex: currentIndex + title.length
          },
          paragraphStyle: {
            namedStyleType: "HEADING_2"
          },
          fields: "namedStyleType"
        }
      });

      currentIndex += title.length + 1;

      // Add period if available
      if (data.period) {
        const periodText = `Period: ${data.period}\n\n`;
        tableRequests.push({
          insertText: {
            location: { index: currentIndex },
            text: periodText
          }
        });
        currentIndex += periodText.length;
      }

      // Create table with header and data rows
      const tableText = [
        "Metric\tCurrent Value\tPrevious Value\tChange",
        `Sessions\t${data.current.sessions}\t${data.previous.sessions}\t${data.changes.sessions}%`,
        `Conversions\t${data.current.conversions}\t${data.previous.conversions}\t${data.changes.conversions}%`,
        `Revenue\t$${data.current.revenue}\t$${data.previous.revenue}\t${data.changes.revenue}%`
      ].join('\n') + '\n\n';

      tableRequests.push({
        insertText: {
          location: { index: currentIndex },
          text: tableText
        }
      });

      currentIndex += tableText.length;

      return tableRequests;
    };

    // Add analysis sections
    if (report.weekly_analysis) {
      requests.push(...createMetricsTable('Weekly Analysis', report.weekly_analysis));
    }
    if (report.monthly_analysis) {
      requests.push(...createMetricsTable('Monthly Analysis', report.monthly_analysis));
    }
    if (report.quarterly_analysis) {
      requests.push(...createMetricsTable('Quarterly Analysis', report.quarterly_analysis));
    }
    if (report.ytd_analysis) {
      requests.push(...createMetricsTable('Year to Date Analysis', report.ytd_analysis));
    }

    // Process requests in batches
    const BATCH_SIZE = 20;
    for (let i = 0; i < requests.length; i += BATCH_SIZE) {
      const batch = requests.slice(i, Math.min(i + BATCH_SIZE, requests.length));
      await docs.documents.batchUpdate({
        documentId: docId,
        requestBody: { requests: batch },
      });
      // Add delay between batches
      if (i + BATCH_SIZE < requests.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

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