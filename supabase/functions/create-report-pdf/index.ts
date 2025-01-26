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

    // Create PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Add jsPDF-AutoTable plugin
    // @ts-ignore
    doc.autoTable = autoTable;

    // Add title
    doc.setFontSize(20)
    doc.setTextColor(37, 99, 235) // Blue color
    doc.text('Analytics Report', 15, 40)

    // Add date
    doc.setFontSize(12)
    doc.setTextColor(107, 114, 128) // Gray color
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 15, 48)

    // Add insights if available
    if (insights) {
      doc.setFontSize(16)
      doc.setTextColor(31, 41, 55)
      doc.text('Key Insights', 15, 60)
      
      doc.setFontSize(12)
      doc.setTextColor(55, 65, 81)
      const insightLines = doc.splitTextToSize(insights, 180)
      doc.text(insightLines, 15, 70)
    }

    let yPosition = insights ? 90 + (insights.length / 100 * 10) : 70

    // Add analysis sections
    const addAnalysisSection = (title: string, data: any) => {
      if (!data?.current) return yPosition

      // Add section title
      doc.setFontSize(16)
      doc.setTextColor(31, 41, 55)
      doc.text(title, 15, yPosition)
      yPosition += 10

      // Add period if available
      if (data.period) {
        doc.setFontSize(12)
        doc.setTextColor(107, 114, 128)
        doc.text(`Period: ${data.period}`, 15, yPosition)
        yPosition += 10
      }

      // Add metrics table
      const metrics = [
        ['Metric', 'Current', 'Change'],
        ['Sessions', data.current.sessions?.toLocaleString() ?? '0', 
         formatChange(data.changes?.sessions)],
        ['Conversions', data.current.conversions?.toLocaleString() ?? '0',
         formatChange(data.changes?.conversions)],
        ['Revenue', data.current.revenue ? `$${data.current.revenue.toLocaleString()}` : '$0',
         formatChange(data.changes?.revenue)]
      ]

      // @ts-ignore
      doc.autoTable({
        startY: yPosition,
        head: [metrics[0]],
        body: metrics.slice(1),
        theme: 'striped',
        styles: { fontSize: 12, cellPadding: 5 },
        headStyles: { fillColor: [37, 99, 235] },
        margin: { left: 15 }
      })

      // Update yPosition after table
      // @ts-ignore
      yPosition = doc.lastAutoTable.finalY + 15

      // Add summary if available
      if (data.summary) {
        doc.setFontSize(12)
        doc.setTextColor(55, 65, 81)
        const summaryLines = doc.splitTextToSize(data.summary, 180)
        doc.text(summaryLines, 15, yPosition)
        yPosition += 10 + (summaryLines.length * 7)
      }

      // Add page break if needed
      if (yPosition > 270) {
        doc.addPage()
        yPosition = 20
      }

      return yPosition
    }

    // Add each analysis section
    if (report.weekly_analysis) yPosition = addAnalysisSection('Weekly Analysis', report.weekly_analysis)
    if (report.monthly_analysis) yPosition = addAnalysisSection('Monthly Analysis', report.monthly_analysis)
    if (report.quarterly_analysis) yPosition = addAnalysisSection('Quarterly Analysis', report.quarterly_analysis)
    if (report.ytd_analysis) yPosition = addAnalysisSection('Year to Date Analysis', report.ytd_analysis)
    if (report.last28_yoy_analysis) yPosition = addAnalysisSection('Last 28 Days Year over Year Analysis', report.last28_yoy_analysis)

    // Convert to base64
    const pdfOutput = doc.output('datauristring')

    console.log('PDF generated successfully')
    return new Response(
      JSON.stringify({ 
        pdfUrl: pdfOutput,
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

function formatChange(change: number | undefined): string {
  if (change === undefined) return ''
  const prefix = change >= 0 ? '+' : ''
  return `${prefix}${change.toFixed(1)}%`
}