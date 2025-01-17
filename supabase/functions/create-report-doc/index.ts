import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
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
    const { report } = await req.json()
    
    // Initialize Google Drive API with service account
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(Deno.env.get('GOOGLE_SERVICE_ACCOUNT') || ''),
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const docs = google.docs({ version: 'v1', auth });
    const drive = google.drive({ version: 'v3', auth });

    // Create a new document
    const document = await docs.documents.create({
      requestBody: {
        title: `Analytics Report - ${new Date().toLocaleDateString()}`,
      },
    });

    const docId = document.data.documentId;
    if (!docId) throw new Error('Failed to create document');

    // Make the document publicly accessible
    await drive.permissions.create({
      fileId: docId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Format the content
    const requests = [];
    
    // Add title
    requests.push({
      insertText: {
        location: { index: 1 },
        text: `Analytics Report\n${new Date().toLocaleDateString()}\n\n`,
      },
    });

    let currentIndex = requests[0].insertText.text.length + 1;

    // Function to add a section
    const addSection = (title: string, data: any) => {
      if (!data) return currentIndex;

      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: `${title}\n`,
        },
      });
      currentIndex += title.length + 1;

      // Add period information
      if (data.period) {
        requests.push({
          insertText: {
            location: { index: currentIndex },
            text: `Period: ${data.period}\n\n`,
          },
        });
        currentIndex += `Period: ${data.period}\n\n`.length;
      }

      // Add metrics
      const metrics = [
        { label: 'Sessions', value: data.current?.sessions, change: data.changes?.sessions },
        { label: 'Conversions', value: data.current?.conversions, change: data.changes?.conversions },
        { label: 'Revenue', value: data.current?.revenue, change: data.changes?.revenue },
      ];

      metrics.forEach(metric => {
        if (metric.value !== undefined) {
          const text = `${metric.label}: ${metric.value} (${metric.change >= 0 ? '+' : ''}${metric.change}%)\n`;
          requests.push({
            insertText: {
              location: { index: currentIndex },
              text,
            },
          });
          currentIndex += text.length;
        }
      });

      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: '\n',
        },
      });
      currentIndex += 1;

      return currentIndex;
    };

    // Add each analysis section
    addSection('Weekly Analysis', report.weekly_analysis);
    addSection('Monthly Analysis', report.monthly_analysis);
    addSection('Quarterly Analysis', report.quarterly_analysis);
    addSection('Year to Date Analysis', report.ytd_analysis);
    addSection('Last 28 Days Year over Year Analysis', report.last28_yoy_analysis);

    // Apply the updates to the document
    await docs.documents.batchUpdate({
      documentId: docId,
      requestBody: {
        requests,
      },
    });

    return new Response(
      JSON.stringify({
        docUrl: `https://docs.google.com/document/d/${docId}/edit`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})