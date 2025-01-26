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

    // Create document content
    const requests = [];
    let currentIndex = 1;

    // Add title
    requests.push({
      insertText: {
        location: { index: currentIndex },
        text: `Analytics Report\n${new Date().toLocaleDateString()}\n\n`
      }
    });

    // Format title
    requests.push({
      updateParagraphStyle: {
        range: {
          startIndex: currentIndex,
          endIndex: currentIndex + "Analytics Report".length
        },
        paragraphStyle: {
          namedStyleType: "HEADING_1",
          alignment: "CENTER"
        },
        fields: "namedStyleType,alignment"
      }
    });

    currentIndex += `Analytics Report\n${new Date().toLocaleDateString()}\n\n`.length;

    // Add insights if available
    if (insights) {
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: `AI Analysis\n\n${insights}\n\n`
        }
      });

      // Format insights heading
      requests.push({
        updateParagraphStyle: {
          range: {
            startIndex: currentIndex,
            endIndex: currentIndex + "AI Analysis".length
          },
          paragraphStyle: {
            namedStyleType: "HEADING_2"
          },
          fields: "namedStyleType"
        }
      });

      currentIndex += `AI Analysis\n\n${insights}\n\n`.length;
    }

    // Helper function to create a metrics section
    const createMetricsSection = (title: string, data: any) => {
      if (!data?.current) return [];
      
      const sectionRequests = [];
      
      // Add section title
      sectionRequests.push({
        insertText: {
          location: { index: currentIndex },
          text: `${title}\n`
        }
      });

      // Format section title
      sectionRequests.push({
        updateParagraphStyle: {
          range: {
            startIndex: currentIndex,
            endIndex: currentIndex + title.length
          },
          paragraphStyle: {
            namedStyleType: "HEADING_2"
          },
          fields: "namedStyleType"
        }
      });

      currentIndex += title.length + 1;

      // Add period if available
      if (data.period) {
        const periodText = `Period: ${data.period}\n\n`;
        sectionRequests.push({
          insertText: {
            location: { index: currentIndex },
            text: periodText
          }
        });
        currentIndex += periodText.length;
      }

      // Add summary text if available
      if (data.summary) {
        const summaryText = `${data.summary}\n\n`;
        sectionRequests.push({
          insertText: {
            location: { index: currentIndex },
            text: summaryText
          }
        });
        currentIndex += summaryText.length;
      }

      // Create metrics table
      const metrics = [];
      
      // Add traffic metrics if available
      if (data.current.sessions !== undefined) {
        metrics.push(`Sessions\t${data.current.sessions}\t${data.previous.sessions}\t${data.changes.sessions.toFixed(1)}%`);
      }
      
      // Add conversion metrics if available
      if (data.current.conversions !== undefined) {
        const conversionType = data.current.conversionGoal || 'Total Conversions';
        metrics.push(`Conversions (${conversionType})\t${data.current.conversions}\t${data.previous.conversions}\t${data.changes.conversions.toFixed(1)}%`);
      }
      
      // Add revenue metrics if available
      if (data.current.revenue !== undefined && data.current.revenue > 0) {
        metrics.push(`Revenue\t$${data.current.revenue}\t$${data.previous.revenue}\t${data.changes.revenue.toFixed(1)}%`);
      }
      
      // Add Search Console metrics if available
      if (data.current.clicks !== undefined) {
        metrics.push(`Clicks\t${Math.round(data.current.clicks)}\t${Math.round(data.previous.clicks)}\t${data.changes.clicks.toFixed(1)}%`);
        metrics.push(`Impressions\t${Math.round(data.current.impressions)}\t${Math.round(data.previous.impressions)}\t${data.changes.impressions.toFixed(1)}%`);
        metrics.push(`CTR\t${data.current.ctr.toFixed(1)}%\t${data.previous.ctr.toFixed(1)}%\t${data.changes.ctr.toFixed(1)}%`);
        metrics.push(`Average Position\t${data.current.position.toFixed(1)}\t${data.previous.position.toFixed(1)}\t${data.changes.position.toFixed(1)}%`);
      }

      if (metrics.length > 0) {
        const tableText = [
          "Metric\tCurrent Value\tPrevious Value\tChange",
          ...metrics
        ].join('\n') + '\n\n';

        sectionRequests.push({
          insertText: {
            location: { index: currentIndex },
            text: tableText
          }
        });

        currentIndex += tableText.length;
      }

      // Add branded vs non-branded analysis if available
      if (data.searchTerms) {
        const brandedTerms = data.searchTerms.filter((term: any) => term.isBranded);
        const nonBrandedTerms = data.searchTerms.filter((term: any) => !term.isBranded);
        
        if (brandedTerms.length > 0 || nonBrandedTerms.length > 0) {
          sectionRequests.push({
            insertText: {
              location: { index: currentIndex },
              text: "\nBranded vs Non-Branded Search Terms\n"
            }
          });

          // Format subsection title
          sectionRequests.push({
            updateParagraphStyle: {
              range: {
                startIndex: currentIndex + 1,
                endIndex: currentIndex + 1 + "Branded vs Non-Branded Search Terms".length
              },
              paragraphStyle: {
                namedStyleType: "HEADING_3"
              },
              fields: "namedStyleType"
            }
          });

          currentIndex += "\nBranded vs Non-Branded Search Terms\n".length;

          const brandedMetrics = [
            "Term\tClicks\tImpressions\tCTR\tPosition",
            ...brandedTerms.map((term: any) => 
              `${term.term}\t${term.current.clicks}\t${term.current.impressions}\t${term.current.ctr}%\t${term.current.position}`
            )
          ].join('\n');

          const nonBrandedMetrics = [
            "Term\tClicks\tImpressions\tCTR\tPosition",
            ...nonBrandedTerms.map((term: any) => 
              `${term.term}\t${term.current.clicks}\t${term.current.impressions}\t${term.current.ctr}%\t${term.current.position}`
            )
          ].join('\n');

          if (brandedTerms.length > 0) {
            const brandedText = `\nBranded Terms:\n${brandedMetrics}\n\n`;
            sectionRequests.push({
              insertText: {
                location: { index: currentIndex },
                text: brandedText
              }
            });
            currentIndex += brandedText.length;
          }

          if (nonBrandedTerms.length > 0) {
            const nonBrandedText = `\nNon-Branded Terms:\n${nonBrandedMetrics}\n\n`;
            sectionRequests.push({
              insertText: {
                location: { index: currentIndex },
                text: nonBrandedText
              }
            });
            currentIndex += nonBrandedText.length;
          }
        }
      }

      // Add top pages analysis if available
      if (data.pages) {
        sectionRequests.push({
          insertText: {
            location: { index: currentIndex },
            text: "\nTop Pages Performance\n"
          }
        });

        // Format subsection title
        sectionRequests.push({
          updateParagraphStyle: {
            range: {
              startIndex: currentIndex + 1,
              endIndex: currentIndex + 1 + "Top Pages Performance".length
            },
            paragraphStyle: {
              namedStyleType: "HEADING_3"
            },
            fields: "namedStyleType"
          }
        });

        currentIndex += "\nTop Pages Performance\n".length;

        const pagesMetrics = [
          "Page\tClicks\tImpressions\tCTR\tPosition",
          ...data.pages.map((page: any) => 
            `${page.page}\t${page.current.clicks}\t${page.current.impressions}\t${page.current.ctr}%\t${page.current.position}`
          )
        ].join('\n') + '\n\n';

        sectionRequests.push({
          insertText: {
            location: { index: currentIndex },
            text: pagesMetrics
          }
        });

        currentIndex += pagesMetrics.length;
      }

      return sectionRequests;
    };

    // Add analysis sections
    if (report.weekly_analysis) {
      requests.push(...createMetricsSection('Weekly Analysis', report.weekly_analysis));
    }
    if (report.monthly_analysis) {
      requests.push(...createMetricsSection('Monthly Analysis', report.monthly_analysis));
    }
    if (report.quarterly_analysis) {
      requests.push(...createMetricsSection('Quarterly Analysis', report.quarterly_analysis));
    }
    if (report.ytd_analysis) {
      requests.push(...createMetricsSection('Year to Date Analysis', report.ytd_analysis));
    }
    if (report.last28_yoy_analysis) {
      requests.push(...createMetricsSection('Last 28 Days Year over Year Analysis', report.last28_yoy_analysis));
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
});