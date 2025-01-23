import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { PDFDocument, rgb, StandardFonts } from 'https://cdn.skypack.dev/pdf-lib'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Received request to generate PDF')
    
    // Validate request body
    let body
    try {
      body = await req.json()
      console.log('Request body:', JSON.stringify(body))
    } catch (error) {
      console.error('Error parsing request body:', error)
      throw new Error('Invalid JSON in request body')
    }

    const { report, insights } = body
    
    if (!report) {
      console.error('No report data provided')
      throw new Error('No report data provided')
    }

    // Create PDF document
    console.log('Creating PDF document...')
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage()
    const { width, height } = page.getSize()
    
    // Add fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    
    // Helper function to write text
    const writeText = (text: string, y: number, options: { fontSize?: number; font?: typeof font; color?: [number, number, number] } = {}) => {
      const { fontSize = 12, font: textFont = font, color = [0, 0, 0] } = options
      page.drawText(text, {
        x: 50,
        y: height - y,
        size: fontSize,
        font: textFont,
        color: rgb(color[0], color[1], color[2])
      })
    }

    // Title
    writeText('Analytics Report', 50, { fontSize: 24, font: boldFont })
    writeText(new Date().toLocaleDateString(), 80)

    // Insights
    if (insights) {
      writeText('Key Insights', 120, { fontSize: 16, font: boldFont })
      const insightLines = insights.split('\n')
      let yPos = 150
      insightLines.forEach(line => {
        writeText(line, yPos)
        yPos += 20
      })
    }

    // Metrics
    Object.entries(report)
      .filter(([key, value]) => value && key !== 'status' && typeof value === 'object')
      .forEach(([period, data]: [string, any], index) => {
        const yStart = 250 + (index * 150)
        
        // Period title
        const title = period.split('_').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
        writeText(title, yStart, { fontSize: 16, font: boldFont })

        // Metrics
        if (data.current) {
          writeText(`Sessions: ${data.current.sessions?.toLocaleString() ?? '0'}`, yStart + 30)
          writeText(`Change: ${data.changes?.sessions >= 0 ? '+' : ''}${data.changes?.sessions?.toFixed(1)}%`, 
            yStart + 50, 
            { color: data.changes?.sessions >= 0 ? [0, 0.5, 0] : [0.8, 0, 0] }
          )

          writeText(`Conversions: ${data.current.conversions?.toLocaleString() ?? '0'}`, yStart + 80)
          writeText(`Change: ${data.changes?.conversions >= 0 ? '+' : ''}${data.changes?.conversions?.toFixed(1)}%`,
            yStart + 100,
            { color: data.changes?.conversions >= 0 ? [0, 0.5, 0] : [0.8, 0, 0] }
          )
        }
      })

    // Generate PDF
    console.log('Generating PDF bytes...')
    const pdfBytes = await pdfDoc.save()
    
    // Convert to base64
    const pdfBase64 = btoa(String.fromCharCode(...pdfBytes))
    const pdfUrl = `data:application/pdf;base64,${pdfBase64}`

    console.log('PDF generated successfully')
    return new Response(
      JSON.stringify({ 
        pdfUrl,
        success: true 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Error generating PDF:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate PDF',
        success: false
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})