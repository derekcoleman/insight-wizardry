import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { google } from "npm:googleapis@126";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BATCH_SIZE = 20;

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
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    let currentIndex = 1;
    const requests: any[] = [];

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
            endIndex: currentIndex + 17,
          },
          paragraphStyle: {
            namedStyleType: "HEADING_1",
            alignment: "CENTER",
          },
          fields: "namedStyleType,alignment",
        },
      }
    );
    currentIndex += 17;

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
              endIndex: currentIndex + 11,
            },
            paragraphStyle: {
              namedStyleType: "HEADING_2",
            },
            fields: "namedStyleType",
          },
        }
      );
      currentIndex += insights.length + 15;
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
      const titleText = `${section.title}\n`;
      requests.push(
        {
          insertText: {
            location: { index: currentIndex },
            text: titleText,
          },
        },
        {
          updateParagraphStyle: {
            range: {
              startIndex: currentIndex,
              endIndex: currentIndex + titleText.length,
            },
            paragraphStyle: {
              namedStyleType: "HEADING_2",
            },
            fields: "namedStyleType",
          },
        }
      );
      currentIndex += titleText.length;

      // Add period information
      if (section.data.period) {
        const periodText = `Period: ${section.data.period}\n\n`;
        requests.push({
          insertText: {
            location: { index: currentIndex },
            text: periodText,
          },
        });
        currentIndex += periodText.length;
      }

      // Create metrics table
      const tableData = [
        ['Metric', 'Current Value', 'Previous Value', 'Change'],
        ['Sessions', section.data.current.sessions, section.data.previous.sessions, `${section.data.changes.sessions}%`],
        ['Conversions', section.data.current.conversions, section.data.previous.conversions, `${section.data.changes.conversions}%`],
        ['Revenue', `$${section.data.current.revenue}`, `$${section.data.previous.revenue}`, `${section.data.changes.revenue}%`],
      ];

      // Insert table structure
      requests.push({
        insertTable: {
          rows: tableData.length,
          columns: tableData[0].length,
          location: { index: currentIndex },
        },
      });

      // Insert table content
      for (let i = 0; i < tableData.length; i++) {
        for (let j = 0; j < tableData[i].length; j++) {
          const cellText = String(tableData[i][j]);
          requests.push({
            insertText: {
              location: { index: currentIndex + 1 }, // Add 1 to account for table cell creation
              text: cellText + (j < tableData[i].length - 1 ? '\t' : '\n'),
            },
          });
          currentIndex += cellText.length + 1;
        }
      }

      // Add spacing after table
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: '\n\n',
        },
      });
      currentIndex += 2;

      // Add search terms table if available
      if (section.data.searchTerms?.length > 0) {
        requests.push({
          insertText: {
            location: { index: currentIndex },
            text: 'Top Search Terms\n',
          },
        });
        currentIndex += 16;

        const searchTermsData = [
          ['Term', 'Current Clicks', 'Previous Clicks', 'Change'],
          ...section.data.searchTerms.map((term: any) => [
            term.term,
            term.current.clicks,
            term.previous.clicks,
            `${term.changes.clicks}%`,
          ]),
        ];

        // Insert search terms table
        requests.push({
          insertTable: {
            rows: searchTermsData.length,
            columns: searchTermsData[0].length,
            location: { index: currentIndex },
          },
        });

        // Insert table content
        for (let i = 0; i < searchTermsData.length; i++) {
          for (let j = 0; j < searchTermsData[i].length; j++) {
            const cellText = String(searchTermsData[i][j]);
            requests.push({
              insertText: {
                location: { index: currentIndex + 1 },
                text: cellText + (j < searchTermsData[i].length - 1 ? '\t' : '\n'),
              },
            });
            currentIndex += cellText.length + 1;
          }
        }

        // Add spacing after table
        requests.push({
          insertText: {
            location: { index: currentIndex },
            text: '\n\n',
          },
        });
        currentIndex += 2;
      }
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