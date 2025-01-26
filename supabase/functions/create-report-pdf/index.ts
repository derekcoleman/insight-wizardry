import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

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
    const { report, insights } = await req.json()

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

    // Add analysis sections
    const addAnalysisSection = (title: string, data: any) => {
      if (!data) return

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

      // @ts-ignore
      doc.autoTable({
        startY: yPosition,
        head: [metrics[0]],
        body: metrics.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [66, 139, 202] },
        margin: { left: 15 }
      })

      // Update yPosition after table
      // @ts-ignore
      yPosition = doc.lastAutoTable.finalY + 15

      // Add summary if available
      if (data.summary) {
        doc.setFontSize(12)
        const summaryLines = doc.splitTextToSize(data.summary, 180)
        doc.text(summaryLines, 15, yPosition)
        yPosition += (summaryLines.length * 7) + 10
      }
    }

    // Add each analysis section
    if (report) {
      addAnalysisSection('Weekly Analysis', report.weekly_analysis)
      addAnalysisSection('Monthly Analysis', report.monthly_analysis)
      addAnalysisSection('Quarterly Analysis', report.quarterly_analysis)
      addAnalysisSection('Year to Date Analysis', report.ytd_analysis)
    }

    // Add insights if available
    if (insights) {
      doc.setFontSize(16)
      doc.text('AI Analysis', 15, yPosition)
      yPosition += 10

      doc.setFontSize(12)
      const insightLines = doc.splitTextToSize(insights, 180)
      doc.text(insightLines, 15, yPosition)
    }

    // Generate PDF
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