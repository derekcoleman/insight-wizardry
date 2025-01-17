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

    if (!serviceAccount.client_email || !serviceAccount.private_key) {
      console.error('Service account missing required fields');
      throw new Error('Service account configuration is incomplete');
    }

    console.log('Initializing Google APIs...');
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
      console.error('Failed to get document ID from created document');
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

    // Add title with heading style
    requests.push({
      insertText: {
        location: { index: currentIndex },
        text: `Analytics Report\n${new Date().toLocaleDateString()}\n\n`,
      },
    });
    requests.push({
      updateParagraphStyle: {
        range: {
          startIndex: currentIndex,
          endIndex: currentIndex + "Analytics Report".length,
        },
        paragraphStyle: {
          namedStyleType: "HEADING_1",
        },
        fields: "namedStyleType",
      },
    });

    currentIndex += `Analytics Report\n${new Date().toLocaleDateString()}\n\n`.length;

    // Add AI Insights if available with formatting
    if (insights) {
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: "AI Analysis\n\n",
        },
      });
      requests.push({
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

      // Convert markdown bold and italic
      const formattedInsights = insights.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: formattedInsights + "\n\n",
        },
      });
      
      // Apply bold formatting
      const boldMatches = [...insights.matchAll(/\*\*(.*?)\*\*/g)];
      boldMatches.forEach(match => {
        const startOffset = insights.indexOf(match[0]);
        requests.push({
          updateTextStyle: {
            range: {
              startIndex: currentIndex + startOffset,
              endIndex: currentIndex + startOffset + match[1].length,
            },
            textStyle: { bold: true },
            fields: "bold",
          },
        });
      });

      // Apply italic formatting
      const italicMatches = [...insights.matchAll(/\*(.*?)\*/g)];
      italicMatches.forEach(match => {
        const startOffset = insights.indexOf(match[0]);
        requests.push({
          updateTextStyle: {
            range: {
              startIndex: currentIndex + startOffset,
              endIndex: currentIndex + startOffset + match[1].length,
            },
            textStyle: { italic: true },
            fields: "italic",
          },
        });
      });

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

    const addSection = (title: string, data: any) => {
      if (!data?.current) return currentIndex;

      // Add section title with heading style
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: `${title}\n`,
        },
      });
      requests.push({
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

      // Create a table for metrics
      const metrics = [
        { label: 'Sessions', value: formatNumber(data.current.sessions), change: formatChange(data.changes?.sessions) },
        { label: 'Conversions', value: formatNumber(data.current.conversions), change: formatChange(data.changes?.conversions) },
        { label: 'Revenue', value: `$${formatNumber(data.current.revenue)}`, change: formatChange(data.changes?.revenue) },
      ];

      // Insert table
      requests.push({
        insertTable: {
          location: { index: currentIndex },
          rows: metrics.length + 1,
          columns: 3,
        },
      });

      // Add table headers
      const headers = ['Metric', 'Value', 'Change'];
      headers.forEach((header, i) => {
        requests.push({
          insertText: {
            location: { index: currentIndex + 1 + i },
            text: header,
          },
        });
      });

      // Add table data
      metrics.forEach((metric, rowIndex) => {
        const rowStart = currentIndex + headers.length + (rowIndex * 3);
        requests.push({
          insertText: {
            location: { index: rowStart + 1 },
            text: metric.label,
          },
        });
        requests.push({
          insertText: {
            location: { index: rowStart + 2 },
            text: metric.value,
          },
        });
        requests.push({
          insertText: {
            location: { index: rowStart + 3 },
            text: metric.change,
          },
        });
      });

      // Update table style
      requests.push({
        updateTableCellStyle: {
          tableRange: {
            tableCellLocation: {
              tableStartLocation: { index: currentIndex },
            },
            rowSpan: metrics.length + 1,
            columnSpan: 3,
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

      currentIndex += (metrics.length + 1) * 3 + 2;

      if (data.searchTerms?.length > 0) {
        requests.push({
          insertText: {
            location: { index: currentIndex },
            text: '\nTop Search Terms\n',
          },
        });
        currentIndex += '\nTop Search Terms\n'.length;

        // Create search terms table
        requests.push({
          insertTable: {
            location: { index: currentIndex },
            rows: data.searchTerms.length + 1,
            columns: 4,
          },
        });

        // Add table headers
        const searchHeaders = ['Term', 'Current Clicks', 'Previous Clicks', 'Change'];
        searchHeaders.forEach((header, i) => {
          requests.push({
            insertText: {
              location: { index: currentIndex + 1 + i },
              text: header,
            },
          });
        });

        // Add search terms data
        data.searchTerms.forEach((term: any, rowIndex: number) => {
          const rowStart = currentIndex + searchHeaders.length + (rowIndex * 4);
          requests.push({
            insertText: {
              location: { index: rowStart + 1 },
              text: term.term,
            },
          });
          requests.push({
            insertText: {
              location: { index: rowStart + 2 },
              text: String(term.current.clicks),
            },
          });
          requests.push({
            insertText: {
              location: { index: rowStart + 3 },
              text: String(term.previous.clicks),
            },
          });
          requests.push({
            insertText: {
              location: { index: rowStart + 4 },
              text: formatChange(term.changes.clicks),
            },
          });
        });

        currentIndex += (data.searchTerms.length + 1) * 4 + 2;
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

    console.log('Adding content sections...');
    addSection('Weekly Analysis', report.weekly_analysis);
    addSection('Monthly Analysis', report.monthly_analysis);
    addSection('Quarterly Analysis', report.quarterly_analysis);
    addSection('Year to Date Analysis', report.ytd_analysis);
    addSection('Last 28 Days Year over Year Analysis', report.last28_yoy_analysis);

    console.log('Applying document updates...');
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