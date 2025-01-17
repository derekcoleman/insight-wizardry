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
      console.error('GOOGLE_SERVICE_ACCOUNT environment variable is not set');
      throw new Error('Google service account configuration is missing');
    }

    let serviceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountStr);
      console.log('Successfully parsed service account configuration');
    } catch (error) {
      console.error('Failed to parse service account JSON:', error);
      throw new Error('Invalid service account configuration');
    }

    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/documents'
      ],
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

    const requests = [];
    let currentIndex = 1;

    // Add title
    requests.push({
      insertText: {
        location: { index: currentIndex },
        text: `Analytics Report\n${new Date().toLocaleDateString()}\n\n`,
      },
    }, {
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
    });

    currentIndex += `Analytics Report\n${new Date().toLocaleDateString()}\n\n`.length;

    // Add AI Insights with formatting
    if (insights) {
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: "AI Analysis\n\n",
        },
      }, {
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
      });
      currentIndex += "AI Analysis\n\n".length;

      const formattedInsights = insights.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: formattedInsights + "\n\n",
        },
      });

      // Batch formatting requests for bold and italic text
      const boldMatches = [...insights.matchAll(/\*\*(.*?)\*\*/g)];
      if (boldMatches.length > 0) {
        const boldRequests = boldMatches.map(match => ({
          updateTextStyle: {
            range: {
              startIndex: currentIndex + insights.indexOf(match[0]),
              endIndex: currentIndex + insights.indexOf(match[0]) + match[1].length,
            },
            textStyle: { bold: true },
            fields: "bold",
          },
        }));
        requests.push(...boldRequests);
      }

      currentIndex += formattedInsights.length + 2;
    }

    const formatNumber = (num: number | undefined) => {
      if (num === undefined || isNaN(num)) return 'N/A';
      return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 2,
        notation: 'compact',
        compactDisplay: 'short'
      }).format(num);
    };

    const formatChange = (change: number | undefined | null) => {
      if (change === undefined || change === null || isNaN(change)) return 'N/A';
      const sign = change >= 0 ? '+' : '';
      return `${sign}${Number(change).toFixed(1)}%`;
    };

    const createTable = (headers: string[], rows: string[][]) => {
      const table = {
        insertTable: {
          rows: rows.length + 1,
          columns: headers.length,
          location: { index: currentIndex },
        },
      };
      requests.push(table);

      // Add headers
      headers.forEach((header, i) => {
        requests.push({
          insertText: {
            location: { index: currentIndex + 1 + i },
            text: header,
          },
        });
      });

      // Add data rows
      rows.forEach((row, rowIndex) => {
        row.forEach((cell, cellIndex) => {
          requests.push({
            insertText: {
              location: { index: currentIndex + headers.length + (rowIndex * headers.length) + cellIndex + 1 },
              text: cell,
            },
          });
        });
      });

      // Style the table
      requests.push({
        updateTableCellStyle: {
          tableRange: {
            tableCellLocation: {
              tableStartLocation: { index: currentIndex },
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

      currentIndex += (rows.length + 1) * headers.length + 2;
    };

    const addSection = (title: string, data: any) => {
      if (!data?.current) return;

      // Add section title
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: `${title}\n`,
        },
      }, {
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
      });
      currentIndex += title.length + 1;

      if (data.period) {
        requests.push({
          insertText: {
            location: { index: currentIndex },
            text: `Period: ${data.period}\n\n`,
          },
        });
        currentIndex += `Period: ${data.period}\n\n`.length;
      }

      // Create metrics table
      const metricsHeaders = ['Metric', 'Value', 'Change'];
      const metricsRows = [
        ['Sessions', formatNumber(data.current.sessions), formatChange(data.changes?.sessions)],
        ['Conversions', formatNumber(data.current.conversions), formatChange(data.changes?.conversions)],
        ['Revenue', `$${formatNumber(data.current.revenue)}`, formatChange(data.changes?.revenue)],
      ];
      createTable(metricsHeaders, metricsRows);

      // Add search terms table if available
      if (data.searchTerms?.length > 0) {
        requests.push({
          insertText: {
            location: { index: currentIndex },
            text: '\nTop Search Terms\n',
          },
        });
        currentIndex += '\nTop Search Terms\n'.length;

        const searchHeaders = ['Term', 'Current Clicks', 'Previous Clicks', 'Change'];
        const searchRows = data.searchTerms.map((term: any) => [
          term.term,
          String(term.current.clicks),
          String(term.previous.clicks),
          formatChange(term.changes.clicks),
        ]);
        createTable(searchHeaders, searchRows);
      }

      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: '\n',
        },
      });
      currentIndex += 1;
    };

    // Process each section
    addSection('Weekly Analysis', report.weekly_analysis);
    addSection('Monthly Analysis', report.monthly_analysis);
    addSection('Quarterly Analysis', report.quarterly_analysis);
    addSection('Year to Date Analysis', report.ytd_analysis);
    addSection('Last 28 Days Year over Year Analysis', report.last28_yoy_analysis);

    // Split requests into smaller batches to avoid API limits
    const BATCH_SIZE = 100;
    const batches = [];
    for (let i = 0; i < requests.length; i += BATCH_SIZE) {
      batches.push(requests.slice(i, i + BATCH_SIZE));
    }

    console.log(`Processing ${batches.length} batches of requests...`);
    for (const batch of batches) {
      await docs.documents.batchUpdate({
        documentId: docId,
        requestBody: { requests: batch },
      });
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
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})