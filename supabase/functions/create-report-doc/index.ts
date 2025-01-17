import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { google } from "npm:googleapis@126";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BATCH_SIZE = 20; // Reduced batch size for API requests

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

    // Create document
    const document = await docs.documents.create({
      requestBody: {
        title: `Analytics Report - ${new Date().toLocaleDateString()}`,
      },
    });

    const docId = document.data.documentId;
    if (!docId) throw new Error('Failed to create document');

    // Set document permissions
    await drive.permissions.create({
      fileId: docId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Helper function to process requests in batches
    async function processBatchRequests(requests: any[]) {
      for (let i = 0; i < requests.length; i += BATCH_SIZE) {
        const batch = requests.slice(i, i + BATCH_SIZE);
        await docs.documents.batchUpdate({
          documentId: docId,
          requestBody: { requests: batch },
        });
        // Add a small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Initialize requests array
    const requests: any[] = [];

    // Add title with formatting
    requests.push(
      {
        insertText: {
          location: { index: 1 },
          text: `Analytics Report\n${new Date().toLocaleDateString()}\n\n`,
        },
      },
      {
        updateParagraphStyle: {
          range: {
            startIndex: 1,
            endIndex: 17,
          },
          paragraphStyle: {
            namedStyleType: "HEADING_1",
            alignment: "CENTER",
          },
          fields: "namedStyleType,alignment",
        },
      }
    );

    let currentIndex = 29;

    // Add AI Insights section
    if (insights) {
      requests.push(
        {
          insertText: {
            location: { index: currentIndex },
            text: "AI Analysis\n\n",
          },
        },
        {
          updateParagraphStyle: {
            range: {
              startIndex: currentIndex,
              endIndex: currentIndex + 11,
            },
            paragraphStyle: {
              namedStyleType: "HEADING_2",
            },
            fields: "namedStyleType",
          },
        }
      );
      
      currentIndex += 13;

      // Process insights text with formatting
      const formattedInsights = insights.replace(/\*\*(.*?)\*\*/g, "$1");
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: formattedInsights + "\n\n",
        },
      });

      // Add bold formatting for sections
      const boldMatches = [...insights.matchAll(/\*\*(.*?)\*\*/g)];
      boldMatches.forEach(match => {
        const startIndex = currentIndex + insights.indexOf(match[0]);
        requests.push({
          updateTextStyle: {
            range: {
              startIndex,
              endIndex: startIndex + match[1].length,
            },
            textStyle: { bold: true },
            fields: "bold",
          },
        });
      });

      currentIndex += formattedInsights.length + 2;
    }

    // Helper function to create table
    function createTableRequests(headers: string[], rows: any[][], startIndex: number) {
      const tableRequests = [];
      
      // Insert table
      tableRequests.push({
        insertTable: {
          rows: rows.length + 1,
          columns: headers.length,
          location: { index: startIndex },
        },
      });

      // Add headers with formatting
      headers.forEach((header, i) => {
        tableRequests.push({
          insertText: {
            location: { index: startIndex + 1 + i },
            text: header,
          },
        });
      });

      // Add data rows
      rows.forEach((row, rowIndex) => {
        row.forEach((cell, cellIndex) => {
          tableRequests.push({
            insertText: {
              location: { 
                index: startIndex + headers.length + (rowIndex * headers.length) + cellIndex + 1 
              },
              text: String(cell),
            },
          });
        });
      });

      // Style the table
      tableRequests.push({
        updateTableCellStyle: {
          tableRange: {
            tableCellLocation: {
              tableStartLocation: { index: startIndex },
            },
            rowSpan: rows.length + 1,
            columnSpan: headers.length,
          },
          tableCellStyle: {
            backgroundColor: { color: { rgbColor: { red: 0.95, green: 0.95, blue: 0.95 } } },
            paddingLeft: { magnitude: 5, unit: 'PT' },
            paddingRight: { magnitude: 5, unit: 'PT' },
            paddingTop: { magnitude: 5, unit: 'PT' },
            paddingBottom: { magnitude: 5, unit: 'PT' },
          },
          fields: 'backgroundColor,paddingLeft,paddingRight,paddingTop,paddingBottom',
        },
      });

      return tableRequests;
    }

    // Process each analysis section
    const sections = [
      { title: "Weekly Analysis", data: report.weekly_analysis },
      { title: "Monthly Analysis", data: report.monthly_analysis },
      { title: "Quarterly Analysis", data: report.quarterly_analysis },
      { title: "Year to Date Analysis", data: report.ytd_analysis },
      { title: "Last 28 Days Year over Year Analysis", data: report.last28_yoy_analysis },
    ];

    for (const section of sections) {
      if (!section.data?.current) continue;

      // Add section title
      requests.push(
        {
          insertText: {
            location: { index: currentIndex },
            text: `${section.title}\n`,
          },
        },
        {
          updateParagraphStyle: {
            range: {
              startIndex: currentIndex,
              endIndex: currentIndex + section.title.length,
            },
            paragraphStyle: {
              namedStyleType: "HEADING_2",
            },
            fields: "namedStyleType",
          },
        }
      );

      currentIndex += section.title.length + 1;

      if (section.data.period) {
        requests.push({
          insertText: {
            location: { index: currentIndex },
            text: `Period: ${section.data.period}\n\n`,
          },
        });
        currentIndex += `Period: ${section.data.period}\n\n`.length;
      }

      // Create metrics table
      const metricsHeaders = ['Metric', 'Current Value', 'Previous Value', 'Change'];
      const metricsRows = [
        ['Sessions', section.data.current.sessions, section.data.previous.sessions, `${section.data.changes.sessions}%`],
        ['Conversions', section.data.current.conversions, section.data.previous.conversions, `${section.data.changes.conversions}%`],
        ['Revenue', `$${section.data.current.revenue}`, `$${section.data.previous.revenue}`, `${section.data.changes.revenue}%`],
      ];

      const tableRequests = createTableRequests(metricsHeaders, metricsRows, currentIndex);
      requests.push(...tableRequests);
      currentIndex += (metricsRows.length + 1) * metricsHeaders.length + 2;

      // Add search terms table if available
      if (section.data.searchTerms?.length > 0) {
        requests.push({
          insertText: {
            location: { index: currentIndex },
            text: '\nTop Search Terms\n',
          },
        });
        currentIndex += '\nTop Search Terms\n'.length;

        const searchHeaders = ['Term', 'Current Clicks', 'Previous Clicks', 'Change'];
        const searchRows = section.data.searchTerms.map((term: any) => [
          term.term,
          term.current.clicks,
          term.previous.clicks,
          `${term.changes.clicks}%`,
        ]);

        const searchTableRequests = createTableRequests(searchHeaders, searchRows, currentIndex);
        requests.push(...searchTableRequests);
        currentIndex += (searchRows.length + 1) * searchHeaders.length + 2;
      }

      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: '\n',
        },
      });
      currentIndex += 1;
    }

    // Process all requests in batches
    console.log(`Processing ${requests.length} requests in batches of ${BATCH_SIZE}...`);
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