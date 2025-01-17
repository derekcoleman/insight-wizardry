import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { google } from "npm:googleapis@126";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

    // Helper function to create table cells with proper formatting
    const createTableCells = (data: string[][], startIndex: number) => {
      const requests = [];
      let currentIndex = startIndex;

      // Insert table structure
      requests.push({
        insertTable: {
          rows: data.length,
          columns: data[0].length,
          location: { index: currentIndex }
        }
      });

      // Add content to cells
      for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].length; j++) {
          const cellText = data[i][j] + (j === data[i].length - 1 ? '\n' : '\t');
          requests.push({
            insertText: {
              location: { index: currentIndex + 1 },
              text: cellText
            }
          });
          currentIndex += cellText.length;
        }
      }

      return { requests, endIndex: currentIndex };
    };

    // Process requests in smaller batches
    const processBatchRequests = async (requests: any[]) => {
      const BATCH_SIZE = 20;
      const batches = [];
      
      for (let i = 0; i < requests.length; i += BATCH_SIZE) {
        batches.push(requests.slice(i, i + BATCH_SIZE));
      }

      for (const batch of batches) {
        await docs.documents.batchUpdate({
          documentId: docId,
          requestBody: { requests: batch },
        });
        await delay(1000); // Add delay between batches
      }
    };

    const requests = [];
    let currentIndex = 1;

    // Add title
    requests.push(
      {
        insertText: {
          location: { index: currentIndex },
          text: `Analytics Report\n${new Date().toLocaleDateString()}\n\n`,
        },
      },
      {
        updateParagraphStyle: {
          range: {
            startIndex: currentIndex,
            endIndex: currentIndex + "Analytics Report".length,
          },
          paragraphStyle: {
            namedStyleType: "HEADING_1",
            alignment: "CENTER"
          },
          fields: "namedStyleType,alignment",
        },
      }
    );

    currentIndex += `Analytics Report\n${new Date().toLocaleDateString()}\n\n`.length;

    // Add insights section if available
    if (insights) {
      requests.push(
        {
          insertText: {
            location: { index: currentIndex },
            text: "AI Analysis\n\n" + insights + "\n\n",
          },
        },
        {
          updateParagraphStyle: {
            range: {
              startIndex: currentIndex,
              endIndex: currentIndex + "AI Analysis".length,
            },
            paragraphStyle: {
              namedStyleType: "HEADING_2",
            },
            fields: "namedStyleType",
          },
        }
      );

      currentIndex += "AI Analysis\n\n".length + insights.length + 2;
    }

    // Helper function to format metrics data
    const formatMetricsData = (data: any) => {
      return [
        ['Metric', 'Current Value', 'Previous Value', 'Change'],
        ['Sessions', 
          data.current.sessions?.toString() || '0',
          data.previous.sessions?.toString() || '0',
          `${data.changes.sessions?.toFixed(1)}%`
        ],
        ['Conversions',
          data.current.conversions?.toString() || '0',
          data.previous.conversions?.toString() || '0',
          `${data.changes.conversions?.toFixed(1)}%`
        ],
        ['Revenue',
          `$${data.current.revenue?.toString() || '0'}`,
          `$${data.previous.revenue?.toString() || '0'}`,
          `${data.changes.revenue?.toFixed(1)}%`
        ]
      ];
    };

    // Add analysis sections
    const addAnalysisSection = (title: string, data: any) => {
      if (!data?.current) return;

      requests.push(
        {
          insertText: {
            location: { index: currentIndex },
            text: `${title}\n`,
          },
        },
        {
          updateParagraphStyle: {
            range: {
              startIndex: currentIndex,
              endIndex: currentIndex + title.length,
            },
            paragraphStyle: {
              namedStyleType: "HEADING_2",
            },
            fields: "namedStyleType",
          },
        }
      );

      currentIndex += title.length + 1;

      if (data.period) {
        const periodText = `Period: ${data.period}\n\n`;
        requests.push({
          insertText: {
            location: { index: currentIndex },
            text: periodText,
          },
        });
        currentIndex += periodText.length;
      }

      // Add metrics table
      const metricsData = formatMetricsData(data);
      const { requests: tableRequests, endIndex } = createTableCells(metricsData, currentIndex);
      requests.push(...tableRequests);
      currentIndex = endIndex + 1;

      // Add spacing after table
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: '\n\n',
        },
      });
      currentIndex += 2;
    };

    // Process each analysis section
    addAnalysisSection('Weekly Analysis', report.weekly_analysis);
    addAnalysisSection('Monthly Analysis', report.monthly_analysis);
    addAnalysisSection('Quarterly Analysis', report.quarterly_analysis);
    addAnalysisSection('Year to Date Analysis', report.ytd_analysis);
    addAnalysisSection('Last 28 Days Year over Year Analysis', report.last28_yoy_analysis);

    // Process all requests in batches
    await processBatchRequests(requests);

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