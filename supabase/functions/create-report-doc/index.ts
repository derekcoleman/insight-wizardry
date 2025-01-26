import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { google } from "npm:googleapis@126";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to create a table
const createTable = (rows: string[][], startIndex: number) => {
  const requests = [];
  
  // Calculate table dimensions
  const numRows = rows.length;
  const numCols = rows[0]?.length || 0;
  
  // Insert a blank line before table
  requests.push({
    insertText: {
      location: { index: startIndex },
      text: "\n"
    }
  });
  
  // Create table
  requests.push({
    insertTable: {
      location: { index: startIndex + 1 },
      rows: numRows,
      columns: numCols
    }
  });
  
  // Fill table cells
  let currentIndex = startIndex + 1;
  rows.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: cell
        }
      });
      
      // Apply header formatting to first row
      if (rowIndex === 0) {
        requests.push({
          updateTextStyle: {
            range: {
              startIndex: currentIndex,
              endIndex: currentIndex + cell.length
            },
            textStyle: {
              bold: true,
              backgroundColor: { color: { rgbColor: { red: 0.9, green: 0.9, blue: 0.9 } } }
            },
            fields: "bold,backgroundColor"
          }
        });
      }
      
      currentIndex += cell.length + 1;
    });
  });
  
  return { requests, endIndex: currentIndex };
};

// Helper function to create a section heading
const createHeading = (text: string, level: number, startIndex: number) => {
  const requests = [
    {
      insertText: {
        location: { index: startIndex },
        text: `${text}\n`
      }
    },
    {
      updateParagraphStyle: {
        range: {
          startIndex: startIndex,
          endIndex: startIndex + text.length
        },
        paragraphStyle: {
          namedStyleType: `HEADING_${level}`,
          spaceAbove: { magnitude: 20, unit: "PT" },
          spaceBelow: { magnitude: 10, unit: "PT" }
        },
        fields: "namedStyleType,spaceAbove,spaceBelow"
      }
    }
  ];
  
  return { requests, endIndex: startIndex + text.length + 1 };
};

// Helper function to process requests in smaller batches
const processBatchRequests = async (docs: any, documentId: string, requests: any[]) => {
  const BATCH_SIZE = 10; // Reduced batch size
  const DELAY_BETWEEN_BATCHES = 1000; // 1 second delay between batches

  for (let i = 0; i < requests.length; i += BATCH_SIZE) {
    const batch = requests.slice(i, Math.min(i + BATCH_SIZE, requests.length));
    try {
      console.log(`Processing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(requests.length / BATCH_SIZE)}`);
      await docs.documents.batchUpdate({
        documentId: documentId,
        requestBody: { requests: batch },
      });
      
      // Add delay between batches
      if (i + BATCH_SIZE < requests.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    } catch (error) {
      console.error(`Error processing batch ${i / BATCH_SIZE + 1}:`, error);
      throw new Error(`Failed to process batch ${i / BATCH_SIZE + 1}: ${error.message}`);
    }
  }
};

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

    // Create new document
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

    // Prepare all requests
    const allRequests = [];
    let currentIndex = 1;

    // Add title
    const titleSection = createHeading('Analytics Report', 1, currentIndex);
    allRequests.push(...titleSection.requests);
    currentIndex = titleSection.endIndex;

    // Add date
    allRequests.push({
      insertText: {
        location: { index: currentIndex },
        text: `${new Date().toLocaleDateString()}\n\n`
      }
    });
    currentIndex += new Date().toLocaleDateString().length + 2;

    // Add AI Analysis section if available
    if (insights) {
      const insightsHeading = createHeading('AI Analysis', 2, currentIndex);
      allRequests.push(...insightsHeading.requests);
      currentIndex = insightsHeading.endIndex;

      allRequests.push({
        insertText: {
          location: { index: currentIndex },
          text: `${insights}\n\n`
        }
      });
      currentIndex += insights.length + 2;
    }

    // Process sections
    const sections = [
      { title: 'Weekly Analysis', data: report.weekly_analysis },
      { title: 'Monthly Analysis', data: report.monthly_analysis },
      { title: 'Quarterly Analysis', data: report.quarterly_analysis },
      { title: 'Year to Date Analysis', data: report.ytd_analysis },
      { title: 'Last 28 Days Year over Year Analysis', data: report.last28_yoy_analysis }
    ];

    for (const section of sections) {
      if (!section.data) continue;

      const headingSection = createHeading(section.title, 2, currentIndex);
      allRequests.push(...headingSection.requests);
      currentIndex = headingSection.endIndex;

      if (section.data.period) {
        allRequests.push({
          insertText: {
            location: { index: currentIndex },
            text: `Period: ${section.data.period}\n\n`
          }
        });
        currentIndex += `Period: ${section.data.period}\n\n`.length;
      }

      if (section.data.summary) {
        allRequests.push({
          insertText: {
            location: { index: currentIndex },
            text: `${section.data.summary}\n\n`
          }
        });
        currentIndex += section.data.summary.length + 2;
      }

      // Add metrics table
      if (section.data.current) {
        const metricsData = [
          ['Metric', 'Current Value', 'Previous Value', 'Change']
        ];

        // Add traffic metrics
        if (section.data.current.sessions !== undefined) {
          metricsData.push([
            'Sessions',
            section.data.current.sessions.toString(),
            section.data.previous.sessions.toString(),
            `${section.data.changes.sessions.toFixed(1)}%`
          ]);
        }

        // Add conversion metrics
        if (section.data.current.conversions !== undefined) {
          const conversionType = section.data.current.conversionGoal || 'Total Conversions';
          metricsData.push([
            `Conversions (${conversionType})`,
            section.data.current.conversions.toString(),
            section.data.previous.conversions.toString(),
            `${section.data.changes.conversions.toFixed(1)}%`
          ]);
        }

        // Add revenue metrics
        if (section.data.current.revenue !== undefined) {
          metricsData.push([
            'Revenue',
            `$${section.data.current.revenue}`,
            `$${section.data.previous.revenue}`,
            `${section.data.changes.revenue.toFixed(1)}%`
          ]);
        }

        const tableSection = createTable(metricsData, currentIndex);
        allRequests.push(...tableSection.requests);
        currentIndex = tableSection.endIndex;
      }
    }

    // Process all requests in smaller batches
    console.log(`Processing ${allRequests.length} total requests in batches...`);
    await processBatchRequests(docs, docId, allRequests);

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
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unknown error occurred' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
});