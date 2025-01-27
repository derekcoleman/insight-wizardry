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

    // Helper function to add text with proper newlines and return the new index
    const addText = async (text: string, style?: any) => {
      const requests = [];
      
      // Always start with a newline to ensure we're in a valid paragraph
      requests.push({
        insertText: {
          location: { index: 1 },
          text: '\n' + text + '\n'
        }
      });

      if (style) {
        requests.push({
          updateParagraphStyle: {
            range: {
              startIndex: 1,
              endIndex: text.length + 1
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

      // Add delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    };

    // Add title
    await addText('Analytics Report', {
      namedStyleType: 'HEADING_1',
      alignment: 'CENTER'
    });

    await addText(new Date().toLocaleDateString());

    // Add insights if available
    if (insights) {
      const sections = insights.split(/(?=Key Findings:|Recommended Next Steps:)/g);
      
      for (const section of sections) {
        const [title, ...content] = section.trim().split('\n');
        
        await addText(title, {
          namedStyleType: 'HEADING_2'
        });

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

            await addText('• ' + cleanLine);
          }
        }
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
        const tableContent = [
          ['Metric', 'Current Value', 'Previous Value', 'Change'],
          ...metrics.map(metric => [
            metric.name,
            metric.current.toString(),
            metric.previous.toString(),
            `${metric.change >= 0 ? '+' : ''}${metric.change.toFixed(1)}%`
          ])
        ];

        // Create table as a single string with tab separators
        const tableText = tableContent
          .map(row => row.join('\t'))
          .join('\n');

        await addText(tableText);
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