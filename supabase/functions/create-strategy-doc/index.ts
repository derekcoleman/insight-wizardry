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

    // Add title
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

      // Add description
      const descriptionText = `Description:\n${topic.description}\n\n`;
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: descriptionText
        }
      });
      currentIndex += descriptionText.length;

      // Add target keywords
      const keywordsText = `Target Keywords:\n${topic.targetKeywords.join(', ')}\n\n`;
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: keywordsText
        }
      });
      currentIndex += keywordsText.length;

      // Add priority
      const priorityText = `Priority: ${topic.priority}\n\n`;
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: priorityText
        }
      });
      currentIndex += priorityText.length;

      // Add implementation steps
      if (topic.implementationSteps && topic.implementationSteps.length > 0) {
        const stepsText = `Implementation Steps:\n${topic.implementationSteps.map(step => `• ${step}`).join('\n')}\n\n`;
        requests.push({
          insertText: {
            location: { index: currentIndex },
            text: stepsText
          }
        });
        currentIndex += stepsText.length;
      }

      // Add conversion strategy
      if (topic.conversionStrategy) {
        const conversionText = `Conversion Strategy:\n${topic.conversionStrategy}\n\n`;
        requests.push({
          insertText: {
            location: { index: currentIndex },
            text: conversionText
          }
        });
        currentIndex += conversionText.length;
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