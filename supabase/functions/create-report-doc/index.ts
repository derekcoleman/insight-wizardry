import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { google } from "npm:googleapis";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { report } = await req.json();
    
    // Initialize Google Docs API
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(Deno.env.get('GOOGLE_SERVICE_ACCOUNT') || '{}'),
      scopes: ['https://www.googleapis.com/auth/documents', 'https://www.googleapis.com/auth/drive'],
    });

    const docs = google.docs({ version: 'v1', auth });
    const drive = google.drive({ version: 'v3', auth });

    // Create a new document
    const doc = await docs.documents.create({
      requestBody: {
        title: `Analytics Report - ${new Date().toLocaleDateString()}`,
      },
    });

    const docId = doc.data.documentId;
    if (!docId) throw new Error('Failed to create document');

    // Format the report data into a readable structure
    const requests = [];
    
    // Add title
    requests.push({
      insertText: {
        location: { index: 1 },
        text: `Analytics Report\n${new Date().toLocaleDateString()}\n\n`,
      },
    });

    let currentIndex = requests[0].insertText.text.length + 1;

    // Add each analysis section
    const sections = ['weekly_analysis', 'monthly_analysis', 'quarterly_analysis', 'ytd_analysis', 'last28_yoy_analysis'];
    const sectionTitles = {
      weekly_analysis: 'Week over Week Analysis',
      monthly_analysis: 'Month over Month Analysis',
      quarterly_analysis: 'Last 90 Days Analysis',
      ytd_analysis: 'Year to Date Analysis',
      last28_yoy_analysis: 'Last 28 Days Year over Year Analysis',
    };

    for (const section of sections) {
      if (report[section]) {
        const analysis = report[section];
        
        // Add section title
        requests.push({
          insertText: {
            location: { index: currentIndex },
            text: `${sectionTitles[section]}\n`,
          },
        });
        currentIndex += sectionTitles[section].length + 1;

        // Add date range
        if (analysis.period) {
          requests.push({
            insertText: {
              location: { index: currentIndex },
              text: `Period: ${analysis.period}\n\n`,
            },
          });
          currentIndex += `Period: ${analysis.period}\n\n`.length;
        }

        // Add metrics
        const metrics = ['sessions', 'conversions', 'revenue'];
        for (const metric of metrics) {
          if (analysis.current && analysis.current[metric] !== undefined) {
            const value = metric === 'revenue' ? `$${analysis.current[metric]}` : analysis.current[metric];
            const change = analysis.changes[metric];
            const changeText = change > 0 ? `+${change}%` : `${change}%`;
            
            requests.push({
              insertText: {
                location: { index: currentIndex },
                text: `${metric.charAt(0).toUpperCase() + metric.slice(1)}: ${value} (${changeText})\n`,
              },
            });
            currentIndex += `${metric.charAt(0).toUpperCase() + metric.slice(1)}: ${value} (${changeText})\n`.length;
          }
        }

        // Add search terms if available
        if (analysis.searchTerms && analysis.searchTerms.length > 0) {
          requests.push({
            insertText: {
              location: { index: currentIndex },
              text: '\nTop Search Terms:\n',
            },
          });
          currentIndex += '\nTop Search Terms:\n'.length;

          for (const term of analysis.searchTerms.slice(0, 5)) {
            requests.push({
              insertText: {
                location: { index: currentIndex },
                text: `- ${term.term}: ${term.clicks} clicks (${term.position} avg position)\n`,
              },
            });
            currentIndex += `- ${term.term}: ${term.clicks} clicks (${term.position} avg position)\n`.length;
          }
        }

        requests.push({
          insertText: {
            location: { index: currentIndex },
            text: '\n',
          },
        });
        currentIndex += 1;
      }
    }

    // Update the document content
    await docs.documents.batchUpdate({
      documentId: docId,
      requestBody: { requests },
    });

    // Make the document publicly accessible with view-only permissions
    await drive.permissions.create({
      fileId: docId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Get the webViewLink
    const file = await drive.files.get({
      fileId: docId,
      fields: 'webViewLink',
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        docUrl: file.data.webViewLink,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating report:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});