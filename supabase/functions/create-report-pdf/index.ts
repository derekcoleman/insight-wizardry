import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { PDFDocument, rgb, StandardFonts } from 'https://cdn.skypack.dev/pdf-lib'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Received request to generate PDF')
    
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

    console.log('Creating PDF document...')
    const pdfDoc = await PDFDocument.create()
    
    // Add fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)
    
    const page = pdfDoc.addPage([595.276, 841.890]) // A4 size
    const { width, height } = page.getSize()
    
    // Colors
    const black = rgb(0, 0, 0)
    const red = rgb(0.8, 0, 0)
    const green = rgb(0, 0.5, 0)
    const gray = rgb(0.5, 0.5, 0.5)
    
    let yOffset = height - 50 // Start from top with margin
    const margin = 50
    const lineHeight = 20
    
    // Helper function to write text
    const writeText = (text: string, options: {
      font?: typeof helveticaFont,
      size?: number,
      color?: typeof black,
      indent?: number,
      maxWidth?: number
    } = {}) => {
      const {
        font = helveticaFont,
        size = 12,
        color = black,
        indent = 0,
        maxWidth = width - (margin * 2)
      } = options
      
      const words = text.split(' ')
      let line = ''
      
      for (const word of words) {
        const testLine = line + (line ? ' ' : '') + word
        const testWidth = font.widthOfTextAtSize(testLine, size)
        
        if (testWidth > maxWidth) {
          page.drawText(line, {
            x: margin + indent,
            y: yOffset,
            size,
            font,
            color
          })
          yOffset -= lineHeight
          line = word
        } else {
          line = testLine
        }
      }
      
      if (line) {
        page.drawText(line, {
          x: margin + indent,
          y: yOffset,
          size,
          font,
          color
        })
        yOffset -= lineHeight
      }
      
      yOffset -= 5 // Add some padding between paragraphs
    }
    
    // Title
    writeText('Analytics Report', { font: helveticaBold, size: 24 })
    writeText(new Date().toLocaleDateString(), { size: 14, color: gray })
    yOffset -= 20
    
    // Key Insights
    if (insights) {
      writeText('Key Insights', { font: helveticaBold, size: 18 })
      yOffset -= 10
      writeText(insights, { size: 12 })
      yOffset -= 20
    }
    
    // Analysis Sections
    const writeSectionData = (title: string, data: any) => {
      if (!data?.current) return
      
      writeText(title, { font: helveticaBold, size: 16 })
      yOffset -= 10
      
      if (data.period) {
        writeText(`Period: ${data.period}`, { font: helveticaOblique, size: 12, color: gray })
        yOffset -= 10
      }
      
      // Metrics table
      const metrics = [
        {
          label: 'Sessions',
          current: data.current.sessions?.toLocaleString() ?? '0',
          change: data.changes?.sessions
        },
        {
          label: 'Conversions',
          current: data.current.conversions?.toLocaleString() ?? '0',
          change: data.changes?.conversions
        },
        {
          label: 'Revenue',
          current: data.current.revenue ? `$${data.current.revenue.toLocaleString()}` : '$0',
          change: data.changes?.revenue
        }
      ]
      
      metrics.forEach(metric => {
        if (metric.current !== '0' && metric.current !== '$0') {
          writeText(`${metric.label}: ${metric.current}`, { size: 12 })
          if (metric.change !== undefined) {
            const changeColor = metric.change >= 0 ? green : red
            const changeSymbol = metric.change >= 0 ? '+' : ''
            writeText(`Change: ${changeSymbol}${metric.change.toFixed(1)}%`, {
              size: 12,
              color: changeColor,
              indent: 20
            })
          }
        }
      })
      
      yOffset -= 20
      
      // Add summary if available
      if (data.summary) {
        writeText('Summary:', { font: helveticaBold, size: 12 })
        writeText(data.summary, { size: 12 })
        yOffset -= 10
      }
    }
    
    // Write each analysis section
    if (report.weekly_analysis) {
      writeSectionData('Weekly Analysis', report.weekly_analysis)
    }
    if (report.monthly_analysis) {
      writeSectionData('Monthly Analysis', report.monthly_analysis)
    }
    if (report.quarterly_analysis) {
      writeSectionData('Quarterly Analysis', report.quarterly_analysis)
    }
    if (report.ytd_analysis) {
      writeSectionData('Year to Date Analysis', report.ytd_analysis)
    }
    if (report.last28_yoy_analysis) {
      writeSectionData('Last 28 Days Year over Year Analysis', report.last28_yoy_analysis)
    }
    
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
        error: error instanceof Error ? error.message : 'Failed to generate PDF',
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