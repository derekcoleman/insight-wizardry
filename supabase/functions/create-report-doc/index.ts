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

    // Initialize requests array
    const requests = [];
    let currentIndex = 1;

    // Helper function to add text with proper newlines
    const addText = (text: string, style?: any) => {
      const textWithNewline = text + '\n';
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: textWithNewline
        }
      });

      if (style) {
        requests.push({
          updateParagraphStyle: {
            range: {
              startIndex: currentIndex,
              endIndex: currentIndex + text.length
            },
            paragraphStyle: style,
            fields: Object.keys(style).join(',')
          }
        });
      }

      currentIndex += textWithNewline.length;
    };

    // Add title
    addText('Analytics Report', {
      namedStyleType: 'HEADING_1',
      alignment: 'CENTER'
    });

    addText(new Date().toLocaleDateString());
    addText(''); // Empty line for spacing

    // Add insights if available
    if (insights) {
      const sections = insights.split(/(?=Key Findings:|Recommended Next Steps:)/g);
      
      for (const section of sections) {
        const [title, ...content] = section.trim().split('\n');
        
        // Add section title
        addText(title, {
          namedStyleType: 'HEADING_2'
        });
        addText(''); // Empty line for spacing

        // Add content with bullet points
        for (const line of content) {
          if (line.trim()) {
            const cleanLine = line.trim()
              .replace(/^[•-]\s*/, '')
              .replace(/^[0-9]+\.\s*/, '')
              .replace(/\*\*(.*?)\*\*/g, '$1')
              .replace(/###\s*/, '')
              .replace(/\[([^\]]+)\]/g, '$1')
              .replace(/\(([^)]+)\)/g, '$1')
              .replace(/`([^`]+)`/g, '$1');

            // Add bullet point
            requests.push({
              insertText: {
                location: { index: currentIndex },
                text: cleanLine + '\n'
              }
            });

            // Add bullet style
            requests.push({
              createParagraphBullets: {
                range: {
                  startIndex: currentIndex,
                  endIndex: currentIndex + cleanLine.length + 1
                },
                bulletPreset: 'BULLET_DISC_CIRCLE_SQUARE'
              }
            });

            currentIndex += cleanLine.length + 1;
          }
        }

        addText(''); // Empty line for spacing
      }
    }

    // Helper function to create a metrics table
    const createMetricsTable = async (title: string, data: any) => {
      if (!data?.current) return;
      
      // Add section title
      addText(title, {
        namedStyleType: 'HEADING_2'
      });

      // Add period if available
      if (data.period) {
        addText(`Period: ${data.period}`);
        addText(''); // Empty line for spacing
      }

      // Create metrics array
      const metrics = [];
      
      if (data.current.sessions !== undefined) {
        metrics.push({
          name: 'Sessions',
          current: data.current.sessions,
          previous: data.previous.sessions,
          change: data.changes.sessions
        });
      }
      
      if (data.current.conversions !== undefined) {
        metrics.push({
          name: `Conversions${data.current.conversionGoal ? ` (${data.current.conversionGoal})` : ''}`,
          current: data.current.conversions,
          previous: data.previous.conversions,
          change: data.changes.conversions
        });
      }
      
      if (data.current.revenue !== undefined && data.current.revenue > 0) {
        metrics.push({
          name: 'Revenue',
          current: `$${data.current.revenue.toLocaleString()}`,
          previous: `$${data.previous.revenue.toLocaleString()}`,
          change: data.changes.revenue
        });
      }

      if (metrics.length > 0) {
        // Add newline before table
        addText('');

        // Create table structure
        const tableRequests = [
          {
            insertTable: {
              location: { index: currentIndex },
              rows: metrics.length + 1,
              columns: 4
            }
          }
        ];

        // Update current index to account for table creation
        currentIndex++;

        // Add headers
        const headers = ['Metric', 'Current Value', 'Previous Value', 'Change'];
        headers.forEach((header, i) => {
          tableRequests.push({
            insertText: {
              location: { index: currentIndex },
              text: header
            }
          });

          // Style header cell
          tableRequests.push({
            updateTextStyle: {
              range: {
                startIndex: currentIndex,
                endIndex: currentIndex + header.length
              },
              textStyle: {
                bold: true,
                backgroundColor: { color: { rgbColor: { red: 0.9, green: 0.9, blue: 0.9 } } }
              },
              fields: 'bold,backgroundColor'
            }
          });

          currentIndex += header.length + 1;
        });

        // Add data rows
        metrics.forEach(metric => {
          [
            metric.name,
            metric.current.toString(),
            metric.previous.toString(),
            `${metric.change >= 0 ? '+' : ''}${metric.change.toFixed(1)}%`
          ].forEach(cell => {
            tableRequests.push({
              insertText: {
                location: { index: currentIndex },
                text: cell
              }
            });
            currentIndex += cell.length + 1;
          });
        });

        // Add table styling
        tableRequests.push({
          updateTableCellStyle: {
            tableRange: {
              tableCellLocation: {
                tableStartLocation: { index: currentIndex - (metrics.length + 1) * 4 }
              },
              rowSpan: metrics.length + 1,
              columnSpan: 4
            },
            tableCellStyle: {
              backgroundColor: { color: { rgbColor: { red: 1, green: 1, blue: 1 } } },
              paddingLeft: { magnitude: 5, unit: 'PT' },
              paddingRight: { magnitude: 5, unit: 'PT' },
              paddingTop: { magnitude: 5, unit: 'PT' },
              paddingBottom: { magnitude: 5, unit: 'PT' }
            },
            fields: 'backgroundColor,paddingLeft,paddingRight,paddingTop,paddingBottom'
          }
        });

        // Process table requests in small batches
        for (let i = 0; i < tableRequests.length; i += 2) {
          const batch = tableRequests.slice(i, Math.min(i + 2, tableRequests.length));
          try {
            await docs.documents.batchUpdate({
              documentId: docId,
              requestBody: { requests: batch },
            });
            // Add delay between batches
            if (i + 2 < tableRequests.length) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } catch (error) {
            console.error(`Error processing table batch ${i / 2 + 1}:`, error);
            throw error;
          }
        }

        // Add newline after table
        addText('');
      }
    };

    // Add analysis sections
    const sections = [
      { title: 'Weekly Analysis', data: report.weekly_analysis },
      { title: 'Monthly Analysis', data: report.monthly_analysis },
      { title: 'Quarterly Analysis', data: report.quarterly_analysis },
      { title: 'Year to Date Analysis', data: report.ytd_analysis },
      { title: 'Last 28 Days Year over Year Analysis', data: report.last28_yoy_analysis }
    ];

    // Process each section
    for (const section of sections) {
      if (section.data) {
        await createMetricsTable(section.title, section.data);
      }
    }

    // Process remaining requests in small batches
    const BATCH_SIZE = 2;
    for (let i = 0; i < requests.length; i += BATCH_SIZE) {
      const batch = requests.slice(i, Math.min(i + BATCH_SIZE, requests.length));
      try {
        await docs.documents.batchUpdate({
          documentId: docId,
          requestBody: { requests: batch },
        });
        // Add delay between batches
        if (i + BATCH_SIZE < requests.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Error processing batch ${i / BATCH_SIZE + 1}:`, error);
        throw error;
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
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unknown error occurred' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
});