import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { report, insights } = await req.json();

    // Initialize browser
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Generate HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { color: #1a1a1a; }
            .section { margin-bottom: 30px; }
            .metric { margin-bottom: 20px; }
            .positive { color: green; }
            .negative { color: red; }
          </style>
        </head>
        <body>
          <h1>Analytics Report</h1>
          
          ${insights ? `
            <div class="section">
              <h2>AI Analysis</h2>
              ${insights.split('\n').map(line => `<p>${line}</p>`).join('')}
            </div>
          ` : ''}

          ${Object.entries(report).map(([period, data]) => {
            if (!data || !data.current) return '';
            
            const formatChange = (change) => {
              const isPositive = parseFloat(change) >= 0;
              return `<span class="${isPositive ? 'positive' : 'negative'}">
                ${isPositive ? '↑' : '↓'} ${Math.abs(parseFloat(change)).toFixed(1)}%
              </span>`;
            };

            return `
              <div class="section">
                <h2>${period.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h2>
                
                <div class="metric">
                  <h3>Sessions</h3>
                  <p>Current: ${data.current.sessions}</p>
                  <p>Previous: ${data.previous.sessions}</p>
                  <p>Change: ${formatChange(data.changes.sessions)}</p>
                </div>

                <div class="metric">
                  <h3>Conversions</h3>
                  <p>Current: ${data.current.conversions}</p>
                  <p>Previous: ${data.previous.conversions}</p>
                  <p>Change: ${formatChange(data.changes.conversions)}</p>
                </div>

                <div class="metric">
                  <h3>Revenue</h3>
                  <p>Current: $${data.current.revenue}</p>
                  <p>Previous: $${data.previous.revenue}</p>
                  <p>Change: ${formatChange(data.changes.revenue)}</p>
                </div>
              </div>
            `;
          }).join('')}
        </body>
      </html>
    `;

    // Set content and generate PDF
    await page.setContent(htmlContent);
    const pdf = await page.pdf({
      format: 'A4',
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    await browser.close();

    // Return PDF as base64 with CORS headers
    return new Response(
      JSON.stringify({ 
        pdf: btoa(String.fromCharCode(...new Uint8Array(pdf)))
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error generating PDF:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});