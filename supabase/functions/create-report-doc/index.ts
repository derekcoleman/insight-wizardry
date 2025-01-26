import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { google } from "npm:googleapis@126";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to create a table
const createTable = (rows: string[][], startIndex: number) => {
  const requests = [];
  
  // Calculate table dimensions
  const numRows = rows.length;
  const numCols = rows[0]?.length || 0;
  
  // Insert a blank line before table
  requests.push({
    insertText: {
      location: { index: startIndex },
      text: "\n"
    }
  });
  
  // Create table
  requests.push({
    insertTable: {
      location: { index: startIndex + 1 },
      rows: numRows,
      columns: numCols
    }
  });
  
  // Fill table cells
  let currentIndex = startIndex + 1;
  rows.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: cell
        }
      });
      
      // Apply header formatting to first row
      if (rowIndex === 0) {
        requests.push({
          updateTextStyle: {
            range: {
              startIndex: currentIndex,
              endIndex: currentIndex + cell.length
            },
            textStyle: {
              bold: true,
              backgroundColor: { color: { rgbColor: { red: 0.9, green: 0.9, blue: 0.9 } } }
            },
            fields: "bold,backgroundColor"
          }
        });
      }
      
      currentIndex += cell.length + 1;
    });
  });
  
  // Apply table styling
  requests.push({
    updateTableCellStyle: {
      tableRange: {
        tableCells: {
          rowSpan: numRows,
          columnSpan: numCols
        }
      },
      tableCellStyle: {
        backgroundColor: { color: { rgbColor: { red: 1, green: 1, blue: 1 } } },
        borderBottom: {
          color: { color: { rgbColor: { red: 0.8, green: 0.8, blue: 0.8 } } },
          width: { magnitude: 1, unit: "PT" },
          dashStyle: "SOLID"
        },
        borderRight: {
          color: { color: { rgbColor: { red: 0.8, green: 0.8, blue: 0.8 } } },
          width: { magnitude: 1, unit: "PT" },
          dashStyle: "SOLID"
        },
        paddingBottom: { magnitude: 5, unit: "PT" },
        paddingTop: { magnitude: 5, unit: "PT" },
        paddingLeft: { magnitude: 5, unit: "PT" },
        paddingRight: { magnitude: 5, unit: "PT" }
      },
      fields: "*"
    }
  });
  
  return { requests, endIndex: currentIndex };
};

// Helper function to create a section heading
const createHeading = (text: string, level: number, startIndex: number) => {
  const requests = [
    {
      insertText: {
        location: { index: startIndex },
        text: `${text}\n`
      }
    },
    {
      updateParagraphStyle: {
        range: {
          startIndex: startIndex,
          endIndex: startIndex + text.length
        },
        paragraphStyle: {
          namedStyleType: `HEADING_${level}`,
          spaceAbove: { magnitude: 20, unit: "PT" },
          spaceBelow: { magnitude: 10, unit: "PT" }
        },
        fields: "namedStyleType,spaceAbove,spaceBelow"
      }
    }
  ];
  
  return { requests, endIndex: startIndex + text.length + 1 };
};

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

    // Create new document
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
    const titleSection = createHeading('Analytics Report', 1, currentIndex);
    requests.push(...titleSection.requests);
    currentIndex = titleSection.endIndex;

    // Add date
    requests.push({
      insertText: {
        location: { index: currentIndex },
        text: `${new Date().toLocaleDateString()}\n\n`
      }
    });
    currentIndex += new Date().toLocaleDateString().length + 2;

    // Add AI Analysis section if available
    if (insights) {
      const insightsHeading = createHeading('AI Analysis', 2, currentIndex);
      requests.push(...insightsHeading.requests);
      currentIndex = insightsHeading.endIndex;

      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: `${insights}\n\n`
        }
      });
      currentIndex += insights.length + 2;
    }

    // Helper function to format metrics data for table
    const formatMetricsData = (data: any) => {
      if (!data?.current) return null;
      
      const rows = [['Metric', 'Current Value', 'Previous Value', 'Change']];
      
      // Add traffic metrics
      if (data.current.sessions !== undefined) {
        rows.push([
          'Sessions',
          data.current.sessions.toString(),
          data.previous.sessions.toString(),
          `${data.changes.sessions.toFixed(1)}%`
        ]);
      }
      
      // Add conversion metrics
      if (data.current.conversions !== undefined) {
        const conversionType = data.current.conversionGoal || 'Total Conversions';
        rows.push([
          `Conversions (${conversionType})`,
          data.current.conversions.toString(),
          data.previous.conversions.toString(),
          `${data.changes.conversions.toFixed(1)}%`
        ]);
      }
      
      // Add revenue metrics
      if (data.current.revenue !== undefined && data.current.revenue > 0) {
        rows.push([
          'Revenue',
          `$${data.current.revenue}`,
          `$${data.previous.revenue}`,
          `${data.changes.revenue.toFixed(1)}%`
        ]);
      }
      
      // Add Search Console metrics
      if (data.current.clicks !== undefined) {
        rows.push([
          'Clicks',
          Math.round(data.current.clicks).toString(),
          Math.round(data.previous.clicks).toString(),
          `${data.changes.clicks.toFixed(1)}%`
        ]);
        rows.push([
          'Impressions',
          Math.round(data.current.impressions).toString(),
          Math.round(data.previous.impressions).toString(),
          `${data.changes.impressions.toFixed(1)}%`
        ]);
        rows.push([
          'CTR',
          `${data.current.ctr.toFixed(1)}%`,
          `${data.previous.ctr.toFixed(1)}%`,
          `${data.changes.ctr.toFixed(1)}%`
        ]);
        rows.push([
          'Average Position',
          data.current.position.toFixed(1),
          data.previous.position.toFixed(1),
          `${data.changes.position.toFixed(1)}%`
        ]);
      }
      
      return rows;
    };

    // Add analysis sections
    const sections = [
      { title: 'Weekly Analysis', data: report.weekly_analysis },
      { title: 'Monthly Analysis', data: report.monthly_analysis },
      { title: 'Quarterly Analysis', data: report.quarterly_analysis },
      { title: 'Year to Date Analysis', data: report.ytd_analysis },
      { title: 'Last 28 Days Year over Year Analysis', data: report.last28_yoy_analysis }
    ];

    for (const section of sections) {
      if (!section.data) continue;

      // Add section heading
      const headingSection = createHeading(section.title, 2, currentIndex);
      requests.push(...headingSection.requests);
      currentIndex = headingSection.endIndex;

      // Add period if available
      if (section.data.period) {
        requests.push({
          insertText: {
            location: { index: currentIndex },
            text: `Period: ${section.data.period}\n\n`
          }
        });
        currentIndex += `Period: ${section.data.period}\n\n`.length;
      }

      // Add summary if available
      if (section.data.summary) {
        requests.push({
          insertText: {
            location: { index: currentIndex },
            text: `${section.data.summary}\n\n`
          }
        });
        currentIndex += section.data.summary.length + 2;
      }

      // Add metrics table
      const metricsData = formatMetricsData(section.data);
      if (metricsData) {
        const tableSection = createTable(metricsData, currentIndex);
        requests.push(...tableSection.requests);
        currentIndex = tableSection.endIndex;
      }

      // Add branded vs non-branded analysis if available
      if (section.data.searchTerms) {
        const brandedTerms = section.data.searchTerms.filter((term: any) => term.isBranded);
        const nonBrandedTerms = section.data.searchTerms.filter((term: any) => !term.isBranded);
        
        if (brandedTerms.length > 0 || nonBrandedTerms.length > 0) {
          const searchTermsHeading = createHeading('Branded vs Non-Branded Search Terms', 3, currentIndex);
          requests.push(...searchTermsHeading.requests);
          currentIndex = searchTermsHeading.endIndex;

          if (brandedTerms.length > 0) {
            const brandedTableData = [
              ['Term', 'Clicks', 'Impressions', 'CTR', 'Position'],
              ...brandedTerms.map((term: any) => [
                term.term,
                term.current.clicks.toString(),
                term.current.impressions.toString(),
                `${term.current.ctr}%`,
                term.current.position
              ])
            ];
            
            const brandedHeading = createHeading('Branded Terms', 4, currentIndex);
            requests.push(...brandedHeading.requests);
            currentIndex = brandedHeading.endIndex;
            
            const brandedTable = createTable(brandedTableData, currentIndex);
            requests.push(...brandedTable.requests);
            currentIndex = brandedTable.endIndex;
          }

          if (nonBrandedTerms.length > 0) {
            const nonBrandedTableData = [
              ['Term', 'Clicks', 'Impressions', 'CTR', 'Position'],
              ...nonBrandedTerms.map((term: any) => [
                term.term,
                term.current.clicks.toString(),
                term.current.impressions.toString(),
                `${term.current.ctr}%`,
                term.current.position
              ])
            ];
            
            const nonBrandedHeading = createHeading('Non-Branded Terms', 4, currentIndex);
            requests.push(...nonBrandedHeading.requests);
            currentIndex = nonBrandedHeading.endIndex;
            
            const nonBrandedTable = createTable(nonBrandedTableData, currentIndex);
            requests.push(...nonBrandedTable.requests);
            currentIndex = nonBrandedTable.endIndex;
          }
        }
      }

      // Add top pages analysis if available
      if (section.data.pages) {
        const pagesHeading = createHeading('Top Pages Performance', 3, currentIndex);
        requests.push(...pagesHeading.requests);
        currentIndex = pagesHeading.endIndex;

        const pagesTableData = [
          ['Page', 'Clicks', 'Impressions', 'CTR', 'Position'],
          ...section.data.pages.map((page: any) => [
            page.page,
            page.current.clicks.toString(),
            page.current.impressions.toString(),
            `${page.current.ctr}%`,
            page.current.position
          ])
        ];
        
        const pagesTable = createTable(pagesTableData, currentIndex);
        requests.push(...pagesTable.requests);
        currentIndex = pagesTable.endIndex;
      }
    }

    // Process requests in batches
    const BATCH_SIZE = 20;
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
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unknown error occurred' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
});