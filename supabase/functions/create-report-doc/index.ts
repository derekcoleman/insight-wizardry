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

    // Add title
    await docs.documents.batchUpdate({
      documentId: docId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: 'Analytics Report\n'
            }
          },
          {
            updateParagraphStyle: {
              range: { startIndex: 1, endIndex: 17 },
              paragraphStyle: {
                namedStyleType: 'HEADING_1',
                alignment: 'CENTER'
              },
              fields: 'namedStyleType,alignment'
            }
          },
          {
            insertText: {
              location: { index: 17 },
              text: `Generated on ${new Date().toLocaleDateString()}\n\n`
            }
          }
        ]
      }
    });

    // Add insights if available
    if (insights) {
      await docs.documents.batchUpdate({
        documentId: docId,
        requestBody: {
          requests: [
            {
              insertText: {
                location: { index: 50 },
                text: 'AI Analysis\n'
              }
            },
            {
              updateParagraphStyle: {
                range: { startIndex: 50, endIndex: 61 },
                paragraphStyle: {
                  namedStyleType: 'HEADING_2'
                },
                fields: 'namedStyleType'
              }
            }
          ]
        }
      });

      const sections = insights.split(/(?=Key Findings:|Recommended Next Steps:)/g);
      let currentIndex = 61;
      
      for (const section of sections) {
        const [title, ...content] = section.trim().split('\n');
        
        // Add section title
        await docs.documents.batchUpdate({
          documentId: docId,
          requestBody: {
            requests: [
              {
                insertText: {
                  location: { index: currentIndex },
                  text: `${title.trim()}\n`
                }
              },
              {
                updateParagraphStyle: {
                  range: { 
                    startIndex: currentIndex, 
                    endIndex: currentIndex + title.length + 1 
                  },
                  paragraphStyle: {
                    namedStyleType: 'HEADING_3'
                  },
                  fields: 'namedStyleType'
                }
              }
            ]
          }
        });
        
        currentIndex += title.length + 1;

        // Add bullet points
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

            await docs.documents.batchUpdate({
              documentId: docId,
              requestBody: {
                requests: [
                  {
                    insertText: {
                      location: { index: currentIndex },
                      text: `• ${cleanLine}\n`
                    }
                  },
                  {
                    updateParagraphStyle: {
                      range: {
                        startIndex: currentIndex,
                        endIndex: currentIndex + cleanLine.length + 3
                      },
                      paragraphStyle: {
                        bulletPreset: 'BULLET_DISC_CIRCLE_SQUARE'
                      },
                      fields: 'bulletPreset'
                    }
                  }
                ]
              }
            });
            
            currentIndex += cleanLine.length + 3;
          }
        }
        
        // Add spacing between sections
        await docs.documents.batchUpdate({
          documentId: docId,
          requestBody: {
            requests: [
              {
                insertText: {
                  location: { index: currentIndex },
                  text: '\n'
                }
              }
            ]
          }
        });
        currentIndex += 1;
      }
    }

    // Process each analysis section
    const sections = [
      { title: 'Weekly Analysis', data: report.weekly_analysis },
      { title: 'Monthly Analysis', data: report.monthly_analysis },
      { title: 'Quarterly Analysis', data: report.quarterly_analysis },
      { title: 'Year to Date Analysis', data: report.ytd_analysis },
      { title: 'Last 28 Days Year over Year Analysis', data: report.last28_yoy_analysis }
    ];

    let currentIndex = insights ? 500 : 100; // Start after insights if they exist

    for (const section of sections) {
      if (!section.data?.current) continue;

      // Add section title
      await docs.documents.batchUpdate({
        documentId: docId,
        requestBody: {
          requests: [
            {
              insertText: {
                location: { index: currentIndex },
                text: `${section.title}\n`
              }
            },
            {
              updateParagraphStyle: {
                range: {
                  startIndex: currentIndex,
                  endIndex: currentIndex + section.title.length + 1
                },
                paragraphStyle: {
                  namedStyleType: 'HEADING_2'
                },
                fields: 'namedStyleType'
              }
            }
          ]
        }
      });

      currentIndex += section.title.length + 1;

      if (section.data.period) {
        await docs.documents.batchUpdate({
          documentId: docId,
          requestBody: {
            requests: [
              {
                insertText: {
                  location: { index: currentIndex },
                  text: `Period: ${section.data.period}\n\n`
                }
              }
            ]
          }
        });
        currentIndex += section.data.period.length + 9;
      }

      // Create metrics table
      const metrics = [];
      if (section.data.current.sessions !== undefined) {
        metrics.push({
          name: 'Sessions',
          current: section.data.current.sessions,
          previous: section.data.previous.sessions,
          change: section.data.changes.sessions
        });
      }
      
      if (section.data.current.conversions !== undefined) {
        metrics.push({
          name: `Conversions${section.data.current.conversionGoal ? ` (${section.data.current.conversionGoal})` : ''}`,
          current: section.data.current.conversions,
          previous: section.data.previous.conversions,
          change: section.data.changes.conversions
        });
      }
      
      if (section.data.current.revenue !== undefined && section.data.current.revenue > 0) {
        metrics.push({
          name: 'Revenue',
          current: `$${section.data.current.revenue.toLocaleString()}`,
          previous: `$${section.data.previous.revenue.toLocaleString()}`,
          change: section.data.changes.revenue
        });
      }

      if (metrics.length > 0) {
        // Create table
        await docs.documents.batchUpdate({
          documentId: docId,
          requestBody: {
            requests: [
              {
                insertTable: {
                  location: { index: currentIndex },
                  rows: metrics.length + 1,
                  columns: 4
                }
              }
            ]
          }
        });

        // Add headers
        const headers = ['Metric', 'Current', 'Previous', 'Change'];
        for (let i = 0; i < headers.length; i++) {
          await docs.documents.batchUpdate({
            documentId: docId,
            requestBody: {
              requests: [
                {
                  insertText: {
                    location: { 
                      index: currentIndex + (i * 2) + 1
                    },
                    text: headers[i]
                  }
                },
                {
                  updateTextStyle: {
                    range: {
                      startIndex: currentIndex + (i * 2) + 1,
                      endIndex: currentIndex + (i * 2) + 1 + headers[i].length
                    },
                    textStyle: { bold: true },
                    fields: 'bold'
                  }
                }
              ]
            }
          });
        }

        // Add metrics data
        currentIndex += 10; // Move past header row
        for (const metric of metrics) {
          const values = [
            metric.name,
            metric.current.toString(),
            metric.previous.toString(),
            `${metric.change >= 0 ? '+' : ''}${metric.change.toFixed(1)}%`
          ];

          for (let i = 0; i < values.length; i++) {
            await docs.documents.batchUpdate({
              documentId: docId,
              requestBody: {
                requests: [
                  {
                    insertText: {
                      location: { 
                        index: currentIndex + (i * 2)
                      },
                      text: values[i]
                    }
                  }
                ]
              }
            });
          }
          currentIndex += 8; // Move to next row
        }

        // Add spacing after table
        await docs.documents.batchUpdate({
          documentId: docId,
          requestBody: {
            requests: [
              {
                insertText: {
                  location: { index: currentIndex + 10 },
                  text: '\n\n'
                }
              }
            ]
          }
        });
        currentIndex += 12;
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