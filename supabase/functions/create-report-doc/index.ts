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

    // Create a new document
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

    // Set document permissions
    console.log('Setting document permissions...');
    await drive.permissions.create({
      fileId: docId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Simple function to append text with basic formatting
    const appendText = async (text: string, style?: { heading?: number, bold?: boolean }) => {
      try {
        await docs.documents.batchUpdate({
          documentId: docId,
          requestBody: {
            requests: [{
              insertText: {
                location: { index: 1 },
                text: text + '\n'
              }
            }]
          }
        });

        if (style?.heading || style?.bold) {
          const endIndex = text.length + 2; // +2 for newline
          await docs.documents.batchUpdate({
            documentId: docId,
            requestBody: {
              requests: [{
                updateParagraphStyle: {
                  range: {
                    startIndex: 1,
                    endIndex: endIndex
                  },
                  paragraphStyle: {
                    namedStyleType: style.heading === 1 ? 'HEADING_1' : 
                                  style.heading === 2 ? 'HEADING_2' : 
                                  'NORMAL_TEXT'
                  },
                  fields: 'namedStyleType'
                }
              }]
            }
          });
        }
      } catch (error) {
        console.error('Error appending text:', error);
        throw error;
      }
    };

    // Add content section by section
    await appendText(`Analytics Report - ${new Date().toLocaleDateString()}`, { heading: 1 });
    await appendText('\nKey Findings', { heading: 2 });
    
    if (insights) {
      await appendText('\n' + insights);
    }

    // Add analysis sections
    const periods = ['weekly', 'monthly', 'quarterly', 'ytd'];
    for (const period of periods) {
      const analysis = report[`${period}_analysis`];
      if (analysis) {
        await appendText(`\n${period.charAt(0).toUpperCase() + period.slice(1)} Analysis`, { heading: 2 });
        await appendText(`Period: ${analysis.period || 'Not specified'}`);
        
        if (analysis.current) {
          await appendText('\nCurrent Period Metrics:');
          for (const [key, value] of Object.entries(analysis.current)) {
            await appendText(`${key}: ${value}`);
          }
        }
        
        if (analysis.previous) {
          await appendText('\nPrevious Period Metrics:');
          for (const [key, value] of Object.entries(analysis.previous)) {
            await appendText(`${key}: ${value}`);
          }
        }
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