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

    let currentIndex = 1;
    const requests = [];

    // Add title
    requests.push({
      insertText: {
        location: { index: currentIndex },
        text: 'Analytics Report\n'
      }
    });

    requests.push({
      updateParagraphStyle: {
        range: {
          startIndex: currentIndex,
          endIndex: currentIndex + 'Analytics Report\n'.length
        },
        paragraphStyle: {
          namedStyleType: 'HEADING_1',
          alignment: 'CENTER'
        },
        fields: 'namedStyleType,alignment'
      }
    });

    currentIndex += 'Analytics Report\n'.length;

    // Add date
    const dateText = `Generated on ${new Date().toLocaleDateString()}\n\n`;
    requests.push({
      insertText: {
        location: { index: currentIndex },
        text: dateText
      }
    });

    currentIndex += dateText.length;

    // Add AI Analysis section if insights are available
    if (insights) {
      const aiAnalysisTitle = 'AI Analysis\n';
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: aiAnalysisTitle
        }
      });

      requests.push({
        updateParagraphStyle: {
          range: {
            startIndex: currentIndex,
            endIndex: currentIndex + aiAnalysisTitle.length
          },
          paragraphStyle: {
            namedStyleType: 'HEADING_2'
          },
          fields: 'namedStyleType'
        }
      });

      currentIndex += aiAnalysisTitle.length;

      const sections = insights.split(/(?=Key Findings:|Recommended Next Steps:)/g);
      
      for (const section of sections) {
        const [title, ...content] = section.trim().split('\n');
        
        // Add section title
        const sectionTitleText = `${title.trim()}\n`;
        requests.push({
          insertText: {
            location: { index: currentIndex },
            text: sectionTitleText
          }
        });

        requests.push({
          updateParagraphStyle: {
            range: {
              startIndex: currentIndex,
              endIndex: currentIndex + sectionTitleText.length
            },
            paragraphStyle: {
              namedStyleType: 'HEADING_3'
            },
            fields: 'namedStyleType'
          }
        });

        currentIndex += sectionTitleText.length;

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

            const bulletPoint = `${cleanLine}\n`;
            requests.push({
              insertText: {
                location: { index: currentIndex },
                text: bulletPoint
              }
            });

            requests.push({
              createParagraphBullets: {
                range: {
                  startIndex: currentIndex,
                  endIndex: currentIndex + bulletPoint.length - 1
                },
                bulletPreset: 'BULLET_DISC_CIRCLE_SQUARE'
              }
            });

            currentIndex += bulletPoint.length;
          }
        }

        // Add spacing between sections
        requests.push({
          insertText: {
            location: { index: currentIndex },
            text: '\n'
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

    for (const section of sections) {
      if (!section.data?.current) continue;

      // Add section title
      const sectionTitle = `${section.title}\n`;
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: sectionTitle
        }
      });

      requests.push({
        updateParagraphStyle: {
          range: {
            startIndex: currentIndex,
            endIndex: currentIndex + sectionTitle.length
          },
          paragraphStyle: {
            namedStyleType: 'HEADING_2'
          },
          fields: 'namedStyleType'
        }
      });

      currentIndex += sectionTitle.length;

      // Add period if available
      if (section.data.period) {
        const periodText = `Period: ${section.data.period}\n\n`;
        requests.push({
          insertText: {
            location: { index: currentIndex },
            text: periodText
          }
        });
        currentIndex += periodText.length;
      }

      // Add summary text if available
      if (section.data.summary) {
        const summaryLines = section.data.summary.split('\n').filter(line => line.trim());
        
        for (const line of summaryLines) {
          const cleanLine = line.trim();
          if (cleanLine) {
            requests.push({
              insertText: {
                location: { index: currentIndex },
                text: cleanLine + '\n\n'
              }
            });
            currentIndex += cleanLine.length + 2;
          }
        }
      }

      // Create metrics table
      if (section.data.current) {
        // Table headers
        const headers = ['Metric', 'Current', 'Previous', 'Change'];
        const headerRow = headers.join('\t') + '\n';
        requests.push({
          insertText: {
            location: { index: currentIndex },
            text: headerRow
          }
        });

        // Make header row bold
        requests.push({
          updateTextStyle: {
            range: {
              startIndex: currentIndex,
              endIndex: currentIndex + headerRow.length - 1
            },
            textStyle: { bold: true },
            fields: 'bold'
          }
        });

        currentIndex += headerRow.length;

        // Add table rows
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

        for (const metric of metrics) {
          const row = [
            metric.name,
            metric.current.toString(),
            metric.previous.toString(),
            `${metric.change >= 0 ? '+' : ''}${typeof metric.change === 'number' ? metric.change.toFixed(1) : metric.change}%`
          ].join('\t') + '\n';

          requests.push({
            insertText: {
              location: { index: currentIndex },
              text: row
            }
          });

          currentIndex += row.length;
        }

        // Add spacing after table
        requests.push({
          insertText: {
            location: { index: currentIndex },
            text: '\n\n'
          }
        });
        currentIndex += 2;
      }
    }

    // Process requests in small batches to avoid API limits
    const BATCH_SIZE = 20;
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
        console.error(`Error processing batch ${i / BATCH_SIZE + 1}:`, error);
        throw error;
      }
    }

    console.log('Document created successfully');
    const docUrl = `https://docs.google.com/document/d/${docId}/edit`;
    
    return new Response(
      JSON.stringify({
        docUrl,
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