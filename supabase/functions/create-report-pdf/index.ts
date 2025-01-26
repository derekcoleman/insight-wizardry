import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { report, insights } = await req.json()
    console.log('Generating PDF with report data:', { hasReport: !!report, hasInsights: !!insights })

    // Create PDF document with auto page break enabled
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    // Enable auto page break
    doc.setAutoPageBreak(true, 15)

    // Add title
    doc.setFontSize(20)
    doc.text('Analytics Report', 15, 20)

    let yPosition = 30

    // Add date
    doc.setFontSize(12)
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 15, yPosition)
    yPosition += 10

    // Helper function to format changes
    const formatChange = (change: number | undefined): string => {
      if (change === undefined) return 'N/A'
      return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`
    }

    // Helper function to format numbers
    const formatNumber = (num: number | undefined): string => {
      if (num === undefined) return 'N/A'
      return num.toLocaleString()
    }

    // Helper function to check if we need a new page
    const checkPageBreak = (requiredSpace: number) => {
      const pageHeight = doc.internal.pageSize.height
      if (yPosition + requiredSpace > pageHeight - 15) {
        doc.addPage()
        yPosition = 20
      }
    }

    // Add analysis sections
    const addAnalysisSection = (title: string, data: any) => {
      if (!data) return
      console.log(`Adding analysis section: ${title}`)

      // Check if we need a new page for the section title
      checkPageBreak(50)

      // Add section title
      doc.setFontSize(16)
      doc.text(title, 15, yPosition)
      yPosition += 10

      // Add metrics table
      const metrics = [
        ['Metric', 'Current', 'Previous', 'Change'],
        ['Sessions', 
          formatNumber(data.current?.sessions),
          formatNumber(data.previous?.sessions),
          formatChange(data.changes?.sessions)],
        ['Conversions',
          formatNumber(data.current?.conversions),
          formatNumber(data.previous?.conversions),
          formatChange(data.changes?.conversions)],
        ['Revenue ($)',
          formatNumber(data.current?.revenue),
          formatNumber(data.previous?.revenue),
          formatChange(data.changes?.revenue)]
      ]

      // Initialize autoTable plugin
      try {
        (autoTable as any)(doc, {
          startY: yPosition,
          head: [metrics[0]],
          body: metrics.slice(1),
          theme: 'striped',
          headStyles: { fillColor: [66, 139, 202] },
          margin: { left: 15 },
          didDrawPage: (data: any) => {
            // Update yPosition after table is drawn
            yPosition = data.cursor.y + 15
          }
        })
      } catch (error) {
        console.error('Error generating table:', error)
        // Fallback to basic text if table generation fails
        metrics.forEach(row => {
          checkPageBreak(7)
          doc.text(row.join(' | '), 15, yPosition)
          yPosition += 7
        })
        yPosition += 8
      }

      // Add summary if available
      if (data.summary) {
        checkPageBreak(20)
        doc.setFontSize(12)
        const summaryLines = doc.splitTextToSize(data.summary, 180)
        doc.text(summaryLines, 15, yPosition)
        yPosition += (summaryLines.length * 7) + 10
      }

      // Add search terms if available
      if (data.searchTerms && data.searchTerms.length > 0) {
        checkPageBreak(40)
        doc.setFontSize(14)
        doc.text('Top Search Terms', 15, yPosition)
        yPosition += 10

        try {
          const searchTermsData = data.searchTerms.slice(0, 10).map((term: any) => [
            term.term,
            term.clicks?.toString() || 'N/A',
            term.impressions?.toString() || 'N/A',
            term.ctr ? `${(term.ctr * 100).toFixed(1)}%` : 'N/A'
          ])

          ;(autoTable as any)(doc, {
            startY: yPosition,
            head: [['Term', 'Clicks', 'Impressions', 'CTR']],
            body: searchTermsData,
            theme: 'striped',
            headStyles: { fillColor: [66, 139, 202] },
            margin: { left: 15 },
            didDrawPage: (data: any) => {
              yPosition = data.cursor.y + 15
            }
          })
        } catch (error) {
          console.error('Error generating search terms table:', error)
        }
      }

      // Add top pages if available
      if (data.pages && data.pages.length > 0) {
        checkPageBreak(40)
        doc.setFontSize(14)
        doc.text('Top Pages', 15, yPosition)
        yPosition += 10

        try {
          const pagesData = data.pages.slice(0, 10).map((page: any) => [
            page.page,
            page.clicks?.toString() || 'N/A',
            page.impressions?.toString() || 'N/A',
            page.ctr ? `${(page.ctr * 100).toFixed(1)}%` : 'N/A'
          ])

          ;(autoTable as any)(doc, {
            startY: yPosition,
            head: [['Page', 'Clicks', 'Impressions', 'CTR']],
            body: pagesData,
            theme: 'striped',
            headStyles: { fillColor: [66, 139, 202] },
            margin: { left: 15 },
            didDrawPage: (data: any) => {
              yPosition = data.cursor.y + 15
            }
          })
        } catch (error) {
          console.error('Error generating pages table:', error)
        }
      }
    }

    // Add each analysis section
    if (report) {
      console.log('Adding analysis sections to PDF')
      addAnalysisSection('Weekly Analysis', report.weekly_analysis)
      addAnalysisSection('Monthly Analysis', report.monthly_analysis)
      addAnalysisSection('Quarterly Analysis', report.quarterly_analysis)
      addAnalysisSection('Year to Date Analysis', report.ytd_analysis)
    }

    // Add insights if available
    if (insights) {
      console.log('Adding insights to PDF')
      checkPageBreak(40)
      doc.setFontSize(16)
      doc.text('AI Analysis', 15, yPosition)
      yPosition += 10

      doc.setFontSize(12)
      const insightLines = doc.splitTextToSize(insights, 180)
      doc.text(insightLines, 15, yPosition)
    }

    // Generate PDF
    console.log('Generating final PDF output')
    const pdfBytes = doc.output('arraybuffer')

    return new Response(
      JSON.stringify({ 
        pdfUrl: `data:application/pdf;base64,${btoa(String.fromCharCode(...new Uint8Array(pdfBytes)))}` 
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
      JSON.stringify({ error: `Error generating PDF: ${error.message}` }),
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