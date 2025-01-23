import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { format } from 'https://esm.sh/date-fns@2.30.0'
import puppeteer from 'https://deno.land/x/puppeteer@16.2.0/mod.ts'

serve(async (req) => {
  try {
    const { report, insights } = await req.json()
    
    // Initialize browser
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    
    // Generate HTML content
    const htmlContent = generateReportHtml(report, insights)
    await page.setContent(htmlContent)
    
    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
      printBackground: true
    })
    
    await browser.close()

    // Return PDF as base64
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdf)))
    const pdfUrl = `data:application/pdf;base64,${pdfBase64}`

    return new Response(
      JSON.stringify({ pdfUrl }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error generating PDF:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to generate PDF' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

function generateReportHtml(report: any, insights: string) {
  const formatMetric = (value: number) => value?.toLocaleString() ?? '0'
  const formatChange = (change: number) => `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 2em; }
          .section { margin: 2em 0; }
          .metric { margin: 1em 0; }
          .positive { color: green; }
          .negative { color: red; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Analytics Report</h1>
          <p>${format(new Date(), 'MMMM d, yyyy')}</p>
        </div>
        
        <div class="section">
          <h2>Key Insights</h2>
          <p style="white-space: pre-line">${insights}</p>
        </div>
        
        ${Object.entries(report)
          .filter(([key, value]) => value && key !== 'status')
          .map(([period, data]: [string, any]) => `
            <div class="section">
              <h2>${period.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</h2>
              
              <div class="metric">
                <h3>Organic Sessions</h3>
                <p>Current: ${formatMetric(data.current.sessions)}</p>
                <p class="${data.changes.sessions >= 0 ? 'positive' : 'negative'}">
                  Change: ${formatChange(data.changes.sessions)}
                </p>
              </div>
              
              <div class="metric">
                <h3>Organic Conversions</h3>
                <p>Current: ${formatMetric(data.current.conversions)}</p>
                <p class="${data.changes.conversions >= 0 ? 'positive' : 'negative'}">
                  Change: ${formatChange(data.changes.conversions)}
                </p>
              </div>
              
              ${data.pages ? `
                <h3>Top Pages Performance</h3>
                <table>
                  <tr>
                    <th>Page</th>
                    <th>Clicks</th>
                    <th>CTR</th>
                    <th>Position</th>
                  </tr>
                  ${data.pages.slice(0, 5).map(page => `
                    <tr>
                      <td>${page.page}</td>
                      <td>${page.current.clicks}</td>
                      <td>${page.current.ctr}%</td>
                      <td>${page.current.position}</td>
                    </tr>
                  `).join('')}
                </table>
              ` : ''}
            </div>
          `).join('')}
      </body>
    </html>
  `
}