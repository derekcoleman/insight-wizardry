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

    let currentIndex = 1;
    const requests = [];

    // Add title
    requests.push({
      insertText: {
        location: { index: currentIndex },
        text: `Analytics Report\n${new Date().toLocaleDateString()}\n\n`
      }
    });

    requests.push({
      updateParagraphStyle: {
        range: { startIndex: currentIndex, endIndex: currentIndex + 30 },
        paragraphStyle: {
          namedStyleType: 'HEADING_1',
          alignment: 'CENTER'
        },
        fields: 'namedStyleType,alignment'
      }
    });

    currentIndex += 30;

    // Add insights if available
    if (insights) {
      // Add Key Findings section
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: "Key Findings:\n\n"
        }
      });

      requests.push({
        updateParagraphStyle: {
          range: { startIndex: currentIndex, endIndex: currentIndex + 14 },
          paragraphStyle: { namedStyleType: 'HEADING_2' },
          fields: 'namedStyleType'
        }
      });

      currentIndex += 14;

      // Process insights text
      const sections = insights.split('\n\n');
      for (const section of sections) {
        if (section.trim()) {
          requests.push({
            insertText: {
              location: { index: currentIndex },
              text: section + '\n\n'
            }
          });
          currentIndex += section.length + 2;
        }
      }
    }

    // Process analysis sections
    const addAnalysisSection = (title: string, data: any) => {
      // Add section title
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: `${title}\n\n`
        }
      });
      currentIndex += title.length + 2;

      // Create table
      const tableRows = [
        ['Metric', 'Current', 'Previous', 'Change'],
        ['Sessions', data.current.sessions.toString(), data.previous.sessions.toString(), `${data.changes.sessions}%`],
        ['Conversions', data.current.conversions.toString(), data.previous.conversions.toString(), `${data.changes.conversions}%`],
        ['Revenue', `$${data.current.revenue}`, `$${data.previous.revenue}`, `${data.changes.revenue}%`]
      ];

      // Insert table
      requests.push({
        insertTable: {
          rows: tableRows.length,
          columns: tableRows[0].length,
          location: { index: currentIndex }
        }
      });

      // Insert table content
      tableRows.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          requests.push({
            insertText: {
              location: { index: currentIndex },
              text: cell + (colIndex < row.length - 1 ? '\t' : '\n')
            }
          });
          currentIndex += cell.length + 1;
        });
      });

      currentIndex += 2; // Add extra spacing after table
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