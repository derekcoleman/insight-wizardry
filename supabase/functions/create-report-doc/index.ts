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

    // Process document creation in smaller batches
    const requests = [];

    // Add title
    requests.push({
      insertText: {
        location: { index: 1 },
        text: `Analytics Report\n${new Date().toLocaleDateString()}\n\n`
      }
    });

    requests.push({
      updateParagraphStyle: {
        range: { startIndex: 1, endIndex: 30 },
        paragraphStyle: {
          namedStyleType: 'HEADING_1',
          alignment: 'CENTER'
        },
        fields: 'namedStyleType,alignment'
      }
    });

    // Process insights section
    if (insights) {
      const sections = insights.split('\n\n');
      let currentIndex = 31;

      for (const section of sections) {
        if (section.startsWith('Key Findings:') || section.startsWith('Recommended Next Steps:')) {
          // Add section header
          requests.push({
            insertText: {
              location: { index: currentIndex },
              text: section.split(':')[0] + ':\n\n'
            }
          });

          requests.push({
            updateParagraphStyle: {
              range: {
                startIndex: currentIndex,
                endIndex: currentIndex + section.split(':')[0].length + 2
              },
              paragraphStyle: { namedStyleType: 'HEADING_2' },
              fields: 'namedStyleType'
            }
          });

          currentIndex += section.split(':')[0].length + 3;
        } else if (section.trim().startsWith('-')) {
          // Process bullet points
          const bulletPoints = section.split('\n').filter(line => line.trim());
          
          for (const point of bulletPoints) {
            const cleanPoint = point.replace(/^-\s*/, '').trim();
            
            requests.push({
              insertText: {
                location: { index: currentIndex },
                text: cleanPoint + '\n'
              }
            });

            // Add bullet style
            requests.push({
              createParagraphBullets: {
                range: {
                  startIndex: currentIndex,
                  endIndex: currentIndex + cleanPoint.length
                },
                bulletPreset: 'BULLET_DISC_CIRCLE_SQUARE'
              }
            });

            currentIndex += cleanPoint.length + 1;
          }
        }
      }
    }

    // Add analysis sections
    const addAnalysisSection = (title: string, data: any) => {
      requests.push({
        insertText: {
          location: { endOfSegmentLocation: {} },
          text: `\n${title}\n\n`
        }
      });

      // Create table
      requests.push({
        insertTable: {
          rows: 4,
          columns: 4,
          location: { endOfSegmentLocation: {} }
        }
      });

      // Add headers
      const headers = ['Metric', 'Current', 'Previous', 'Change'];
      headers.forEach((header, i) => {
        requests.push({
          insertText: {
            location: { endOfSegmentLocation: {} },
            text: header + (i < headers.length - 1 ? '\t' : '\n')
          }
        });
      });

      // Add data rows
      const metrics = [
        ['Sessions', data.current.sessions, data.previous.sessions, `${data.changes.sessions}%`],
        ['Conversions', data.current.conversions, data.previous.conversions, `${data.changes.conversions}%`],
        ['Revenue', `$${data.current.revenue}`, `$${data.previous.revenue}`, `${data.changes.revenue}%`]
      ];

      metrics.forEach(row => {
        row.forEach((cell, i) => {
          requests.push({
            insertText: {
              location: { endOfSegmentLocation: {} },
              text: cell + (i < row.length - 1 ? '\t' : '\n')
            }
          });
        });
      });
    };

    // Add analysis sections
    if (report.weekly_analysis) {
      addAnalysisSection('Weekly Analysis', report.weekly_analysis);
    }
    if (report.monthly_analysis) {
      addAnalysisSection('Monthly Analysis', report.monthly_analysis);
    }
    if (report.quarterly_analysis) {
      addAnalysisSection('Quarterly Analysis', report.quarterly_analysis);
    }
    if (report.ytd_analysis) {
      addAnalysisSection('Year to Date Analysis', report.ytd_analysis);
    }

    // Process requests in smaller batches
    const BATCH_SIZE = 10;
    console.log('Processing document updates in batches...');
    
    for (let i = 0; i < requests.length; i += BATCH_SIZE) {
      const batch = requests.slice(i, i + BATCH_SIZE);
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