import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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

    // Generate HTML content with styling
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            @page {
              @top-right {
                content: counter(page);
              }
              margin: 2.5cm;
              size: A4;
            }
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .header {
              position: running(header);
              width: 100%;
              text-align: left;
              padding: 10px 0;
              border-bottom: 1px solid #eee;
            }
            .logo {
              height: 40px;
              margin-bottom: 10px;
            }
            h1 {
              color: #2563eb;
              font-size: 24px;
              margin-bottom: 20px;
            }
            h2 {
              color: #1e40af;
              font-size: 20px;
              margin-top: 30px;
              margin-bottom: 15px;
            }
            .section {
              margin-bottom: 30px;
            }
            .metric {
              margin: 10px 0;
              padding-left: 20px;
            }
            .positive {
              color: #059669;
            }
            .negative {
              color: #dc2626;
            }
            .date {
              color: #6b7280;
              font-size: 14px;
            }
            .insights {
              background: #f8fafc;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="data:image/png;base64,${await fetchLogoAsBase64()}" class="logo" alt="Standup Notez Logo" />
          </div>
          
          <h1>Analytics Report</h1>
          <div class="date">${new Date().toLocaleDateString()}</div>
          
          ${insights ? `
            <div class="section insights">
              <h2>Key Insights</h2>
              <p>${insights}</p>
            </div>
          ` : ''}
          
          ${generateAnalysisSections(report)}
        </body>
      </html>
    `

    // Convert HTML to PDF using WeasyPrint
    const process = new Deno.Command('weasyprint', {
      args: ['-', '-'],
      stdin: 'piped',
      stdout: 'piped',
    })

    const child = process.spawn()
    const writer = child.stdin.getWriter()
    await writer.write(new TextEncoder().encode(htmlContent))
    await writer.close()

    const output = await child.output()
    const pdfBytes = output.stdout

    // Convert to base64
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)))
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

async function fetchLogoAsBase64(): Promise<string> {
  const logoUrl = 'https://raw.githubusercontent.com/your-repo/standup-notez/main/public/logo.png'
  const response = await fetch(logoUrl)
  const arrayBuffer = await response.arrayBuffer()
  return btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
}

function generateAnalysisSections(report: any): string {
  const sections = []
  
  const addSection = (title: string, data: any) => {
    if (!data?.current) return
    
    sections.push(`
      <div class="section">
        <h2>${title}</h2>
        ${data.period ? `<div class="date">Period: ${data.period}</div>` : ''}
        
        ${generateMetricsHtml(data)}
        
        ${data.summary ? `
          <div class="summary">
            <h3>Summary</h3>
            <p>${data.summary}</p>
          </div>
        ` : ''}
      </div>
    `)
  }
  
  if (report.weekly_analysis) addSection('Weekly Analysis', report.weekly_analysis)
  if (report.monthly_analysis) addSection('Monthly Analysis', report.monthly_analysis)
  if (report.quarterly_analysis) addSection('Quarterly Analysis', report.quarterly_analysis)
  if (report.ytd_analysis) addSection('Year to Date Analysis', report.ytd_analysis)
  if (report.last28_yoy_analysis) addSection('Last 28 Days Year over Year Analysis', report.last28_yoy_analysis)
  
  return sections.join('\n')
}

function generateMetricsHtml(data: any): string {
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
  
  return metrics.map(metric => {
    if (metric.current === '0' || metric.current === '$0') return ''
    
    const changeHtml = metric.change !== undefined
      ? `<span class="${metric.change >= 0 ? 'positive' : 'negative'}">
           ${metric.change >= 0 ? '+' : ''}${metric.change.toFixed(1)}%
         </span>`
      : ''
    
    return `
      <div class="metric">
        <strong>${metric.label}:</strong> ${metric.current}
        ${changeHtml}
      </div>
    `
  }).join('\n')
}