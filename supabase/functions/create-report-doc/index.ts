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

    let currentIndex = 1;

    // Helper function to add text with proper newlines and return the new index
    const addText = async (text: string, style?: any) => {
      const textWithNewline = text + '\n';
      const requests = [{
        insertText: {
          location: { index: currentIndex },
          text: textWithNewline
        }
      }];

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

      await docs.documents.batchUpdate({
        documentId: docId,
        requestBody: { requests },
      });

      currentIndex += textWithNewline.length;
      // Add delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    };

    // Add title
    await addText('Analytics Report', {
      namedStyleType: 'HEADING_1',
      alignment: 'CENTER'
    });

    await addText(new Date().toLocaleDateString());
    await addText(''); // Empty line for spacing

    // Add insights if available
    if (insights) {
      const sections = insights.split(/(?=Key Findings:|Recommended Next Steps:)/g);
      
      for (const section of sections) {
        const [title, ...content] = section.trim().split('\n');
        
        await addText(title, {
          namedStyleType: 'HEADING_2'
        });
        await addText(''); // Empty line for spacing

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

            const bulletRequest = {
              insertText: {
                location: { index: currentIndex },
                text: cleanLine + '\n'
              }
            };

            const bulletStyleRequest = {
              createParagraphBullets: {
                range: {
                  startIndex: currentIndex,
                  endIndex: currentIndex + cleanLine.length + 1
                },
                bulletPreset: 'BULLET_DISC_CIRCLE_SQUARE'
              }
            };

            await docs.documents.batchUpdate({
              documentId: docId,
              requestBody: { requests: [bulletRequest, bulletStyleRequest] },
            });

            currentIndex += cleanLine.length + 1;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        await addText(''); // Empty line for spacing
      }
    }

    // Helper function to create a metrics table
    const createMetricsTable = async (title: string, data: any) => {
      if (!data?.current) return;
      
      await addText(title, {
        namedStyleType: 'HEADING_2'
      });

      if (data.period) {
        await addText(`Period: ${data.period}`);
        await addText(''); // Empty line for spacing
      }

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
        // Create table
        const createTableRequest = {
          insertTable: {
            location: { index: currentIndex },
            rows: metrics.length + 1, // +1 for header
            columns: 4
          }
        };

        await docs.documents.batchUpdate({
          documentId: docId,
          requestBody: { requests: [createTableRequest] },
        });

        currentIndex++; // Move past table insertion point

        // Add headers
        const headers = ['Metric', 'Current Value', 'Previous Value', 'Change'];
        for (const header of headers) {
          const headerRequest = {
            insertText: {
              location: { index: currentIndex },
              text: header
            }
          };

          const headerStyleRequest = {
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
          };

          await docs.documents.batchUpdate({
            documentId: docId,
            requestBody: { requests: [headerRequest, headerStyleRequest] },
          });

          currentIndex += header.length + 1;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Add data rows
        for (const metric of metrics) {
          const cells = [
            metric.name,
            metric.current.toString(),
            metric.previous.toString(),
            `${metric.change >= 0 ? '+' : ''}${metric.change.toFixed(1)}%`
          ];

          for (const cell of cells) {
            const cellRequest = {
              insertText: {
                location: { index: currentIndex },
                text: cell
              }
            };

            await docs.documents.batchUpdate({
              documentId: docId,
              requestBody: { requests: [cellRequest] },
            });

            currentIndex += cell.length + 1;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        await addText(''); // Empty line after table
      }
    };

    // Process each analysis section
    const sections = [
      { title: 'Weekly Analysis', data: report.weekly_analysis },
      { title: 'Monthly Analysis', data: report.monthly_analysis },
      { title: 'Quarterly Analysis', data: report.quarterly_analysis },
      { title: 'Year to Date Analysis', data: report.ytd_analysis },
      { title: 'Last 28 Days Year over Year Analysis', data: report.last28_yoy_analysis }
    ];

    for (const section of sections) {
      if (section.data) {
        await createMetricsTable(section.title, section.data);
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