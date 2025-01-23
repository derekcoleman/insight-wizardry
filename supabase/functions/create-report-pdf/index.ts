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
    
    let currentPage = pdfDoc.addPage([595.276, 841.890]) // A4 size
    const { width, height } = currentPage.getSize()
    
    // Colors
    const black = rgb(0, 0, 0)
    const red = rgb(0.8, 0, 0)
    const green = rgb(0, 0.5, 0)
    const gray = rgb(0.5, 0.5, 0.5)
    
    let yOffset = height - 50 // Start from top with margin
    const margin = 50
    const lineHeight = 14 // Reduced line height for better spacing
    const pageBreakThreshold = margin + 50 // Minimum space needed before starting new content
    
    // Helper function to sanitize text for PDF
    const sanitizeText = (text: string) => {
      if (!text) return '';
      return text.replace(/[\n\r]/g, ' ').trim()
    }

    // Helper function to check if we need a new page
    const checkNewPage = (neededSpace: number) => {
      if (yOffset - neededSpace < pageBreakThreshold) {
        currentPage = pdfDoc.addPage([595.276, 841.890])
        yOffset = height - 50
        return true
      }
      return false
    }
    
    // Helper function to write text with word wrap
    const writeText = (text: string, options: {
      font?: typeof helveticaFont,
      size?: number,
      color?: typeof black,
      indent?: number,
      maxWidth?: number,
      addSpacing?: boolean
    } = {}) => {
      const {
        font = helveticaFont,
        size = 11,
        color = black,
        indent = 0,
        maxWidth = width - (margin * 2),
        addSpacing = true
      } = options

      const sanitizedText = sanitizeText(text)
      if (!sanitizedText) return;
      
      const words = sanitizedText.split(' ')
      let line = ''
      let estimatedLines = Math.ceil(font.widthOfTextAtSize(sanitizedText, size) / maxWidth)
      
      // Check if we need a new page
      checkNewPage(estimatedLines * lineHeight)
      
      for (const word of words) {
        const testLine = line + (line ? ' ' : '') + word
        const testWidth = font.widthOfTextAtSize(testLine, size)
        
        if (testWidth > maxWidth) {
          if (line) {
            if (checkNewPage(lineHeight)) {
              // Reset line if we're starting a new page
              line = word
              continue
            }
            currentPage.drawText(line, {
              x: margin + indent,
              y: yOffset,
              size,
              font,
              color
            })
            yOffset -= lineHeight
          }
          line = word
        } else {
          line = testLine
        }
      }
      
      if (line) {
        currentPage.drawText(line, {
          x: margin + indent,
          y: yOffset,
          size,
          font,
          color
        })
        yOffset -= lineHeight
      }
      
      if (addSpacing) {
        yOffset -= 8 // Add some padding between paragraphs
      }
    }
    
    // Title and Date
    writeText('Analytics Report', { font: helveticaBold, size: 24 })
    writeText(new Date().toLocaleDateString(), { size: 12, color: gray })
    yOffset -= 20
    
    // Key Insights
    if (insights) {
      writeText('Key Insights', { font: helveticaBold, size: 18 })
      yOffset -= 10
      writeText(insights, { size: 11 })
      yOffset -= 20
    }
    
    // Analysis Sections
    const writeSectionData = (title: string, data: any) => {
      if (!data?.current) return
      
      checkNewPage(100) // Estimate space needed for section header and initial content
      
      writeText(title, { font: helveticaBold, size: 16 })
      yOffset -= 10
      
      if (data.period) {
        writeText(`Period: ${data.period}`, { font: helveticaOblique, size: 11, color: gray })
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
          checkNewPage(lineHeight * 3) // Space for metric and its change
          
          writeText(`${metric.label}: ${metric.current}`, { size: 11, addSpacing: false })
          if (metric.change !== undefined) {
            const changeColor = metric.change >= 0 ? green : red
            const changeSymbol = metric.change >= 0 ? '+' : ''
            writeText(`Change: ${changeSymbol}${metric.change.toFixed(1)}%`, {
              size: 11,
              color: changeColor,
              indent: 20,
              addSpacing: false
            })
          }
          yOffset -= 8
        }
      })
      
      yOffset -= 12
      
      // Add summary if available
      if (data.summary) {
        checkNewPage(60) // Estimate space needed for summary
        writeText('Summary:', { font: helveticaBold, size: 11 })
        writeText(sanitizeText(data.summary), { size: 11 })
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