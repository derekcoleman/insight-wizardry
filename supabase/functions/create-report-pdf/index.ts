import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import { 
  checkPageBreak, 
  addMetricsTable, 
  addSearchTermsTable, 
  addPagesTable 
} from './pdfUtils.ts'

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

    const addAnalysisSection = (title: string, data: any) => {
      if (!data) return yPosition

      console.log(`Adding analysis section: ${title}`)
      yPosition = checkPageBreak(doc, yPosition, 50)

      // Add section title
      doc.setFontSize(16)
      doc.text(title, 15, yPosition)
      yPosition += 10

      // Add metrics table
      yPosition = addMetricsTable(doc, yPosition, data)

      // Add summary if available
      if (data.summary) {
        yPosition = checkPageBreak(doc, yPosition, 20)
        doc.setFontSize(12)
        const summaryLines = doc.splitTextToSize(data.summary, 180)
        doc.text(summaryLines, 15, yPosition)
        yPosition += (summaryLines.length * 7) + 10
      }

      // Add search terms if available
      if (data.searchTerms?.length > 0) {
        yPosition = checkPageBreak(doc, yPosition, 40)
        doc.setFontSize(14)
        doc.text('Top Search Terms', 15, yPosition)
        yPosition += 10
        yPosition = addSearchTermsTable(doc, yPosition, data.searchTerms)
      }

      // Add top pages if available
      if (data.pages?.length > 0) {
        yPosition = checkPageBreak(doc, yPosition, 40)
        doc.setFontSize(14)
        doc.text('Top Pages', 15, yPosition)
        yPosition += 10
        yPosition = addPagesTable(doc, yPosition, data.pages)
      }

      return yPosition
    }

    // Add each analysis section
    if (report) {
      console.log('Adding analysis sections to PDF')
      yPosition = addAnalysisSection('Weekly Analysis', report.weekly_analysis)
      yPosition = addAnalysisSection('Monthly Analysis', report.monthly_analysis)
      yPosition = addAnalysisSection('Quarterly Analysis', report.quarterly_analysis)
      yPosition = addAnalysisSection('Year to Date Analysis', report.ytd_analysis)
    }

    // Add insights if available
    if (insights) {
      console.log('Adding insights to PDF')
      yPosition = checkPageBreak(doc, yPosition, 40)
      doc.setFontSize(16)
      doc.text('AI Analysis', 15, yPosition)
      yPosition += 10

      doc.setFontSize(12)
      const insightLines = doc.splitTextToSize(insights, 180)
      doc.text(insightLines, 15, yPosition)
    }

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