import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

export const formatChange = (change: number | undefined): string => {
  if (change === undefined) return 'N/A'
  return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`
}

export const formatNumber = (num: number | undefined): string => {
  if (num === undefined) return 'N/A'
  return num.toLocaleString()
}

export const checkPageBreak = (doc: jsPDF, yPosition: number, requiredSpace: number): number => {
  const pageHeight = doc.internal.pageSize.height
  if (yPosition + requiredSpace > pageHeight - 15) {
    doc.addPage()
    return 20
  }
  return yPosition
}

export const addMetricsTable = (doc: jsPDF, yPosition: number, data: any): number => {
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

  try {
    // @ts-ignore
    doc.autoTable({
      startY: yPosition,
      head: [metrics[0]],
      body: metrics.slice(1),
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202] },
      margin: { left: 15 },
    })
    return doc.lastAutoTable.finalY + 10
  } catch (error) {
    console.error('Error generating metrics table:', error)
    let currentY = yPosition
    metrics.forEach(row => {
      currentY = checkPageBreak(doc, currentY, 7)
      doc.text(row.join(' | '), 15, currentY)
      currentY += 7
    })
    return currentY + 8
  }
}

export const addSearchTermsTable = (doc: jsPDF, yPosition: number, searchTerms: any[]): number => {
  if (!searchTerms?.length) return yPosition

  try {
    const searchTermsData = searchTerms.slice(0, 10).map(term => [
      term.term,
      term.clicks?.toString() || 'N/A',
      term.impressions?.toString() || 'N/A',
      term.ctr ? `${(term.ctr * 100).toFixed(1)}%` : 'N/A'
    ])

    // @ts-ignore
    doc.autoTable({
      startY: yPosition,
      head: [['Term', 'Clicks', 'Impressions', 'CTR']],
      body: searchTermsData,
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202] },
      margin: { left: 15 },
    })
    return doc.lastAutoTable.finalY + 10
  } catch (error) {
    console.error('Error generating search terms table:', error)
    return yPosition
  }
}

export const addPagesTable = (doc: jsPDF, yPosition: number, pages: any[]): number => {
  if (!pages?.length) return yPosition

  try {
    const pagesData = pages.slice(0, 10).map(page => [
      page.page,
      page.clicks?.toString() || 'N/A',
      page.impressions?.toString() || 'N/A',
      page.ctr ? `${(page.ctr * 100).toFixed(1)}%` : 'N/A'
    ])

    // @ts-ignore
    doc.autoTable({
      startY: yPosition,
      head: [['Page', 'Clicks', 'Impressions', 'CTR']],
      body: pagesData,
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202] },
      margin: { left: 15 },
    })
    return doc.lastAutoTable.finalY + 10
  } catch (error) {
    console.error('Error generating pages table:', error)
    return yPosition
  }
}