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
    const { topics } = await req.json()
    
    if (!topics || !Array.isArray(topics)) {
      throw new Error('No strategy data provided');
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
        title: `SEO Content Strategy - ${new Date().toLocaleDateString()}`,
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

    // Add title with formatting
    requests.push({
      insertText: {
        location: { index: currentIndex },
        text: `SEO Content Strategy\n${new Date().toLocaleDateString()}\n\n`
      }
    });

    // Format title
    requests.push({
      updateParagraphStyle: {
        range: {
          startIndex: currentIndex,
          endIndex: currentIndex + "SEO Content Strategy".length
        },
        paragraphStyle: {
          namedStyleType: "HEADING_1",
          alignment: "CENTER"
        },
        fields: "namedStyleType,alignment"
      }
    });

    currentIndex += `SEO Content Strategy\n${new Date().toLocaleDateString()}\n\n`.length;

    // Add content topics
    for (const topic of topics) {
      // Add topic title
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: `${topic.title}\n`
        }
      });

      // Format topic title
      requests.push({
        updateParagraphStyle: {
          range: {
            startIndex: currentIndex,
            endIndex: currentIndex + topic.title.length
          },
          paragraphStyle: {
            namedStyleType: "HEADING_2"
          },
          fields: "namedStyleType"
        }
      });

      currentIndex += topic.title.length + 1;

      // Add description with formatting
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: "Description:\n"
        }
      });
      
      requests.push({
        updateTextStyle: {
          range: {
            startIndex: currentIndex,
            endIndex: currentIndex + "Description:".length
          },
          textStyle: { bold: true },
          fields: "bold"
        }
      });

      currentIndex += "Description:\n".length;

      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: `${topic.description}\n\n`
        }
      });
      currentIndex += topic.description.length + 2;

      // Add target keywords
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: "Target Keywords:\n"
        }
      });

      requests.push({
        updateTextStyle: {
          range: {
            startIndex: currentIndex,
            endIndex: currentIndex + "Target Keywords:".length
          },
          textStyle: { bold: true },
          fields: "bold"
        }
      });

      currentIndex += "Target Keywords:\n".length;

      const keywordsText = topic.targetKeywords.join(', ') + '\n\n';
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: keywordsText
        }
      });
      currentIndex += keywordsText.length;

      // Add priority with color coding
      const priorityColor = {
        high: { red: 0.8, green: 0.3, blue: 0.3 },
        medium: { red: 0.9, green: 0.6, blue: 0.3 },
        low: { red: 0.3, green: 0.6, blue: 0.3 }
      }[topic.priority];

      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: "Priority: "
        }
      });

      requests.push({
        updateTextStyle: {
          range: {
            startIndex: currentIndex,
            endIndex: currentIndex + "Priority:".length
          },
          textStyle: { bold: true },
          fields: "bold"
        }
      });

      currentIndex += "Priority: ".length;

      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: `${topic.priority.toUpperCase()}\n\n`
        }
      });

      requests.push({
        updateTextStyle: {
          range: {
            startIndex: currentIndex,
            endIndex: currentIndex + topic.priority.length
          },
          textStyle: {
            foregroundColor: { color: { rgbColor: priorityColor } },
            bold: true
          },
          fields: "foregroundColor,bold"
        }
      });

      currentIndex += topic.priority.length + 2;

      // Add implementation steps with bullet points
      if (topic.implementationSteps?.length > 0) {
        requests.push({
          insertText: {
            location: { index: currentIndex },
            text: "Implementation Steps:\n"
          }
        });

        requests.push({
          updateTextStyle: {
            range: {
              startIndex: currentIndex,
              endIndex: currentIndex + "Implementation Steps:".length
            },
            textStyle: { bold: true },
            fields: "bold"
          }
        });

        currentIndex += "Implementation Steps:\n".length;

        for (const step of topic.implementationSteps) {
          requests.push({
            insertText: {
              location: { index: currentIndex },
              text: `${step}\n`
            }
          });

          requests.push({
            createParagraphBullets: {
              range: {
                startIndex: currentIndex,
                endIndex: currentIndex + step.length + 1
              },
              bulletPreset: "BULLET_DISC_CIRCLE_SQUARE"
            }
          });

          currentIndex += step.length + 1;
        }

        requests.push({
          insertText: {
            location: { index: currentIndex },
            text: "\n"
          }
        });
        currentIndex += 1;
      }

      // Add conversion strategy
      if (topic.conversionStrategy) {
        requests.push({
          insertText: {
            location: { index: currentIndex },
            text: "Conversion Strategy:\n"
          }
        });

        requests.push({
          updateTextStyle: {
            range: {
              startIndex: currentIndex,
              endIndex: currentIndex + "Conversion Strategy:".length
            },
            textStyle: { bold: true },
            fields: "bold"
          }
        });

        currentIndex += "Conversion Strategy:\n".length;

        requests.push({
          insertText: {
            location: { index: currentIndex },
            text: `${topic.conversionStrategy}\n\n`
          }
        });
        currentIndex += topic.conversionStrategy.length + 2;
      }

      // Add separator
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: "---\n\n"
        }
      });
      currentIndex += "---\n\n".length;
    }

    // Process requests in small batches to avoid API limits
    const BATCH_SIZE = 3;
    for (let i = 0; i < requests.length; i += BATCH_SIZE) {
      const batch = requests.slice(i, Math.min(i + BATCH_SIZE, requests.length));
      try {
        await docs.documents.batchUpdate({
          documentId: docId,
          requestBody: { requests: batch },
        });
        // Add delay between batches
        if (i + BATCH_SIZE < requests.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`Error processing batch ${i / BATCH_SIZE + 1}:`, error);
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
    console.error('Error in create-strategy-doc function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unknown error occurred' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
});