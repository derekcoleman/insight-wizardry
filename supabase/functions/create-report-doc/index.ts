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

    // Helper function to create table cells with proper formatting
    const createTableCell = (content: string, bold = false) => ({
      content: [{
        paragraph: {
          elements: [{
            textRun: {
              content: content,
              textStyle: bold ? { bold: true } : undefined
            }
          }]
        }
      }]
    });

    // Helper function to create a table
    const createTable = (data: any, title: string) => {
      const tableRequests = [];
      
      // Add section title
      tableRequests.push({
        insertText: {
          location: { endOfSegmentLocation: {} },
          text: `${title}\n\n`
        }
      });

      // Create table
      tableRequests.push({
        insertTable: {
          rows: 4,
          columns: 4,
          location: { endOfSegmentLocation: {} }
        }
      });

      // Add header row
      const headers = ['Metric', 'Current Value', 'Previous Value', 'Change'];
      headers.forEach((header, i) => {
        tableRequests.push({
          updateTableCellStyle: {
            tableStartLocation: { index: -1 },
            rowIndex: 0,
            columnIndex: i,
            tableCellStyle: {
              backgroundColor: { color: { rgbColor: { red: 0.95, green: 0.95, blue: 0.95 } } }
            },
            fields: 'backgroundColor'
          }
        });
      });

      // Add data rows
      const metrics = [
        ['Sessions', data.current.sessions, data.previous.sessions, `${data.changes.sessions}%`],
        ['Conversions', data.current.conversions, data.previous.conversions, `${data.changes.conversions}%`],
        ['Revenue', `$${data.current.revenue}`, `$${data.previous.revenue}`, `${data.changes.revenue}%`]
      ];

      metrics.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          tableRequests.push({
            insertText: {
              location: { endOfSegmentLocation: {} },
              text: cell.toString()
            }
          });
        });
      });

      return tableRequests;
    };

    // Helper function to convert markdown to Google Docs formatting
    const convertMarkdownToRequests = (text: string) => {
      const requests = [];
      let currentIndex = 1;

      // Split text into paragraphs
      const paragraphs = text.split('\n');
      
      for (const paragraph of paragraphs) {
        if (paragraph.trim() === '') {
          requests.push({
            insertText: {
              location: { index: currentIndex },
              text: '\n'
            }
          });
          currentIndex += 1;
          continue;
        }

        // Handle bullet points
        if (paragraph.trim().startsWith('- ')) {
          const bulletText = paragraph.trim().substring(2);
          requests.push({
            insertText: {
              location: { index: currentIndex },
              text: bulletText + '\n'
            }
          });
          requests.push({
            createParagraphBullets: {
              range: {
                startIndex: currentIndex,
                endIndex: currentIndex + bulletText.length
              },
              bulletPreset: 'BULLET_DISC_CIRCLE_SQUARE'
            }
          });
          currentIndex += bulletText.length + 1;
          continue;
        }

        // Handle bold text
        let text = paragraph;
        const boldMatches = text.match(/\*\*(.*?)\*\*/g);
        if (boldMatches) {
          let lastIndex = currentIndex;
          let plainText = text;
          
          boldMatches.forEach(match => {
            const content = match.slice(2, -2);
            const parts = plainText.split(match);
            
            if (parts[0]) {
              requests.push({
                insertText: {
                  location: { index: lastIndex },
                  text: parts[0]
                }
              });
              lastIndex += parts[0].length;
            }

            requests.push({
              insertText: {
                location: { index: lastIndex },
                text: content
              }
            });
            requests.push({
              updateTextStyle: {
                range: {
                  startIndex: lastIndex,
                  endIndex: lastIndex + content.length
                },
                textStyle: { bold: true },
                fields: 'bold'
              }
            });
            lastIndex += content.length;
            
            plainText = parts[1];
          });

          if (plainText) {
            requests.push({
              insertText: {
                location: { index: lastIndex },
                text: plainText + '\n'
              }
            });
            lastIndex += plainText.length + 1;
          }
          currentIndex = lastIndex;
          continue;
        }

        // Regular text
        requests.push({
          insertText: {
            location: { index: currentIndex },
            text: text + '\n'
          }
        });
        currentIndex += text.length + 1;
      }

      return requests;
    };

    // Process document creation in batches
    const BATCH_SIZE = 20;
    const requests = [];

    // Add title
    requests.push(
      {
        insertText: {
          location: { index: 1 },
          text: `Analytics Report\n${new Date().toLocaleDateString()}\n\n`
        }
      },
      {
        updateParagraphStyle: {
          range: {
            startIndex: 1,
            endIndex: 17
          },
          paragraphStyle: {
            namedStyleType: 'HEADING_1',
            alignment: 'CENTER'
          },
          fields: 'namedStyleType,alignment'
        }
      }
    );

    // Add insights with proper formatting
    if (insights) {
      requests.push(...convertMarkdownToRequests(insights));
    }

    // Add analysis sections with tables
    if (report.weekly_analysis) {
      requests.push(...createTable(report.weekly_analysis, 'Weekly Analysis'));
    }
    if (report.monthly_analysis) {
      requests.push(...createTable(report.monthly_analysis, 'Monthly Analysis'));
    }
    if (report.quarterly_analysis) {
      requests.push(...createTable(report.quarterly_analysis, 'Quarterly Analysis'));
    }
    if (report.ytd_analysis) {
      requests.push(...createTable(report.ytd_analysis, 'Year to Date Analysis'));
    }

    // Process requests in batches
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