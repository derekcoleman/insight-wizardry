import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { google } from "npm:googleapis@126";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
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

    // Helper function to create table cells
    const createTableCell = (content: string, isBold = false) => ({
      content: [{
        paragraph: {
          elements: [{
            textRun: {
              content: content,
              textStyle: isBold ? { bold: true } : undefined
            }
          }]
        }
      }]
    });

    // Helper function to create a table
    const createTable = (data: any, title: string) => {
      const requests = [];
      
      // Add section title
      requests.push({
        insertText: {
          location: { endOfSegmentLocation: {} },
          text: `${title}\n\n`
        }
      });

      // Create table structure
      requests.push({
        insertTable: {
          rows: 4,
          columns: 4,
          location: { endOfSegmentLocation: {} }
        }
      });

      // Add header cells
      const headers = ['Metric', 'Current Value', 'Previous Value', 'Change'];
      headers.forEach((header, i) => {
        requests.push({
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

      // Add data cells
      const metrics = [
        ['Sessions', data.current.sessions, data.previous.sessions, `${data.changes.sessions}%`],
        ['Conversions', data.current.conversions, data.previous.conversions, `${data.changes.conversions}%`],
        ['Revenue', `$${data.current.revenue}`, `$${data.previous.revenue}`, `${data.changes.revenue}%`]
      ];

      metrics.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          requests.push({
            insertTableCell: {
              tableCellLocation: {
                tableStartLocation: { index: -1 },
                rowIndex: rowIndex + 1,
                columnIndex: colIndex
              },
              cell: createTableCell(cell.toString(), colIndex === 0)
            }
          });
        });
      });

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
            endIndex: 30
          },
          paragraphStyle: {
            namedStyleType: 'HEADING_1',
            alignment: 'CENTER'
          },
          fields: 'namedStyleType,alignment'
        }
      }
    );

    // Process insights with proper formatting
    if (insights) {
      const sections = insights.split('\n\n');
      let currentIndex = 30;

      sections.forEach(section => {
        if (section.startsWith('**')) {
          // Handle headers
          const headerText = section.replace(/\*\*/g, '');
          requests.push({
            insertText: {
              location: { index: currentIndex },
              text: headerText + '\n\n'
            }
          });
          requests.push({
            updateParagraphStyle: {
              range: {
                startIndex: currentIndex,
                endIndex: currentIndex + headerText.length
              },
              paragraphStyle: {
                namedStyleType: 'HEADING_2'
              },
              fields: 'namedStyleType'
            }
          });
          currentIndex += headerText.length + 2;
        } else if (section.startsWith('- ')) {
          // Handle bullet points
          const bulletPoints = section.split('\n');
          bulletPoints.forEach(point => {
            if (point.trim()) {
              const cleanPoint = point.replace(/^-\s*/, '').replace(/\*\*(.*?)\*\*/g, '$1');
              requests.push({
                insertText: {
                  location: { index: currentIndex },
                  text: cleanPoint + '\n'
                }
              });
              
              // Apply bullet style
              requests.push({
                createParagraphBullets: {
                  range: {
                    startIndex: currentIndex,
                    endIndex: currentIndex + cleanPoint.length
                  },
                  bulletPreset: 'BULLET_DISC_CIRCLE_SQUARE'
                }
              });
              
              // Find and apply bold formatting
              const boldMatches = point.match(/\*\*(.*?)\*\*/g);
              if (boldMatches) {
                boldMatches.forEach(match => {
                  const boldText = match.replace(/\*\*/g, '');
                  const startIdx = cleanPoint.indexOf(boldText);
                  if (startIdx !== -1) {
                    requests.push({
                      updateTextStyle: {
                        range: {
                          startIndex: currentIndex + startIdx,
                          endIndex: currentIndex + startIdx + boldText.length
                        },
                        textStyle: { bold: true },
                        fields: 'bold'
                      }
                    });
                  }
                });
              }
              
              currentIndex += cleanPoint.length + 1;
            }
          });
        } else {
          // Handle regular paragraphs
          requests.push({
            insertText: {
              location: { index: currentIndex },
              text: section + '\n\n'
            }
          });
          currentIndex += section.length + 2;
        }
      });
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
    console.log('Processing document updates in batches...');
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
        console.error('Error in batch update:', error);
        console.error('Failed batch:', JSON.stringify(batch, null, 2));
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