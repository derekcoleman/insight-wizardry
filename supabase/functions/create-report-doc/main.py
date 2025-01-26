from docxtpl import DocxTemplate, InlineImage
from docx.shared import Mm
import json
import base64
import os
from datetime import datetime

def handler(req):
    if req.method == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
            }
        }

    try:
        # Load request body
        body = json.loads(req.body)
        report = body.get('report')
        insights = body.get('insights')

        if not report:
            raise ValueError('No report data provided')

        # Create a new document from template
        doc = DocxTemplate("template.docx")

        # Format data for template
        def format_change(change):
            if change is None:
                return 'N/A'
            return f"{'+' if change >= 0 else ''}{change:.1f}%"

        def format_number(num):
            if num is None:
                return 'N/A'
            return f"{num:,}"

        # Prepare metrics tables
        def prepare_metrics_table(analysis_data):
            if not analysis_data or 'current' not in analysis_data:
                return []
            
            metrics = []
            if 'sessions' in analysis_data['current']:
                metrics.append({
                    'metric': 'Sessions',
                    'current': format_number(analysis_data['current'].get('sessions')),
                    'previous': format_number(analysis_data['previous'].get('sessions')),
                    'change': format_change(analysis_data['changes'].get('sessions'))
                })
            
            if 'conversions' in analysis_data['current']:
                metrics.append({
                    'metric': 'Conversions',
                    'current': format_number(analysis_data['current'].get('conversions')),
                    'previous': format_number(analysis_data['previous'].get('conversions')),
                    'change': format_change(analysis_data['changes'].get('conversions'))
                })
            
            if 'revenue' in analysis_data['current']:
                metrics.append({
                    'metric': 'Revenue ($)',
                    'current': format_number(analysis_data['current'].get('revenue')),
                    'previous': format_number(analysis_data['previous'].get('revenue')),
                    'change': format_change(analysis_data['changes'].get('revenue'))
                })

            return metrics

        # Prepare search terms tables
        def prepare_search_terms_table(search_terms):
            if not search_terms:
                return []
            
            return [{
                'term': term['term'],
                'current_clicks': format_number(term['current'].get('clicks')),
                'current_impressions': format_number(term['current'].get('impressions')),
                'current_ctr': f"{term['current'].get('ctr', 0):.1f}%",
                'current_position': f"{term['current'].get('position', 0):.1f}"
            } for term in search_terms[:10]]  # Top 10 terms

        # Prepare context for template
        context = {
            'generated_date': datetime.now().strftime('%B %d, %Y'),
            'insights': insights,
            'weekly_analysis': {
                'metrics': prepare_metrics_table(report.get('weekly_analysis')),
                'search_terms': prepare_search_terms_table(report.get('weekly_analysis', {}).get('searchTerms'))
            },
            'monthly_analysis': {
                'metrics': prepare_metrics_table(report.get('monthly_analysis')),
                'search_terms': prepare_search_terms_table(report.get('monthly_analysis', {}).get('searchTerms'))
            },
            'quarterly_analysis': {
                'metrics': prepare_metrics_table(report.get('quarterly_analysis')),
                'search_terms': prepare_search_terms_table(report.get('quarterly_analysis', {}).get('searchTerms'))
            },
            'ytd_analysis': {
                'metrics': prepare_metrics_table(report.get('ytd_analysis')),
                'search_terms': prepare_search_terms_table(report.get('ytd_analysis', {}).get('searchTerms'))
            }
        }

        # Render template
        doc.render(context)

        # Save document
        output_path = "/tmp/report.docx"
        doc.save(output_path)

        # Read file and encode to base64
        with open(output_path, "rb") as file:
            encoded_string = base64.b64encode(file.read()).decode()

        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            },
            "body": json.dumps({
                "docUrl": f"data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,{encoded_string}"
            })
        }

    except Exception as e:
        print(f"Error in create-report-doc function: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            },
            "body": json.dumps({
                "error": str(e)
            })
        }