import { formatEventName } from "./ga4-service.ts";

function formatChange(value: number, includeDirection: boolean = false): string {
  const direction = value >= 0 ? 'improved' : 'declined';
  return `${value >= 0 ? 'increased' : 'decreased'} by ${Math.abs(value).toFixed(1)}% ${includeDirection ? `(${direction})` : ''}`;
}

export function analyzeTimePeriod(
  currentData: any,
  previousData: any,
  currentGSCData: any,
  previousGSCData: any,
  periodText: string,
  currentDateRange: { start: Date; end: Date },
  previousDateRange: { start: Date; end: Date }
) {
  const changes = calculateChanges(currentData, previousData);
  const gscChanges = calculateGSCChanges(currentGSCData, previousGSCData);

  return {
    current: currentData,
    previous: previousData,
    changes,
    gscChanges,
    period: `${formatDateRange(currentDateRange)} vs ${formatDateRange(previousDateRange)}`,
    summary: generateDetailedSummary(changes, currentData, previousData, periodText, currentGSCData, previousGSCData, gscChanges),
    dataSources: {
      ga4: true,
      gsc: Boolean(currentGSCData && previousGSCData)
    }
  };
}

function generateDetailedSummary(
  changes: any, 
  current: any, 
  previous: any, 
  periodText: string, 
  currentGSCData?: any, 
  previousGSCData?: any, 
  gscChanges?: any
) {
  let summary = `${periodText} Performance Analysis:\n\n`;
  
  // Get channel-specific metrics if they exist and we're looking at organic search
  const isOrganicSearch = current.channelGroupings?.organic_search && 
                         Object.keys(current.channelGroupings).length === 1;
  
  const metricsToUse = isOrganicSearch ? {
    current: current.channelGroupings.organic_search,
    previous: previous.channelGroupings.organic_search,
    changes: {
      sessions: ((current.channelGroupings.organic_search.sessions - previous.channelGroupings.organic_search.sessions) / previous.channelGroupings.organic_search.sessions) * 100,
      conversions: ((current.channelGroupings.organic_search.conversions - previous.channelGroupings.organic_search.conversions) / previous.channelGroupings.organic_search.conversions) * 100,
      revenue: ((current.channelGroupings.organic_search.revenue - previous.channelGroupings.organic_search.revenue) / previous.channelGroupings.organic_search.revenue) * 100,
    }
  } : {
    current,
    previous,
    changes
  };
  
  // Traffic and Engagement
  summary += `Traffic and Engagement:\n`;
  const sessionPrefix = isOrganicSearch ? "Organic search" : "Total";
  summary += `${sessionPrefix} sessions ${formatChange(metricsToUse.changes.sessions, true)} from ${metricsToUse.previous.sessions.toLocaleString()} to ${metricsToUse.current.sessions.toLocaleString()}. `;
  
  // Conversions
  if (metricsToUse.current.conversions > 0) {
    const conversionType = formatEventName(current.conversionGoal || 'Total Conversions');
    const conversionPrefix = isOrganicSearch ? "Organic search" : "Total";
    summary += `\n\nConversions:\n${conversionPrefix} ${conversionType} ${formatChange(metricsToUse.changes.conversions, true)} from ${metricsToUse.previous.conversions.toLocaleString()} to ${metricsToUse.current.conversions.toLocaleString()}. `;
  }
  
  // Revenue
  if (metricsToUse.current.revenue > 0) {
    const revenuePrefix = isOrganicSearch ? "Organic search" : "Total";
    summary += `\n\nRevenue:\n${revenuePrefix} revenue ${formatChange(metricsToUse.changes.revenue, true)} from $${metricsToUse.previous.revenue.toLocaleString()} to $${metricsToUse.current.revenue.toLocaleString()}. `;
  }
  
  // GSC Metrics if available
  if (currentGSCData && previousGSCData && gscChanges) {
    summary += `\n\nSearch Console Metrics:\n`;
    summary += `Clicks ${formatChange(gscChanges.clicks, true)} from ${previousGSCData.clicks.toLocaleString()} to ${currentGSCData.clicks.toLocaleString()}. `;
    summary += `Impressions ${formatChange(gscChanges.impressions, true)} from ${previousGSCData.impressions.toLocaleString()} to ${currentGSCData.impressions.toLocaleString()}. `;
    
    if (currentGSCData.ctr > 0 && previousGSCData.ctr > 0) {
      summary += `CTR ${formatChange(gscChanges.ctr, true)} from ${(previousGSCData.ctr * 100).toFixed(2)}% to ${(currentGSCData.ctr * 100).toFixed(2)}%. `;
    }
    
    if (currentGSCData.position > 0 && previousGSCData.position > 0) {
      const positionChange = -gscChanges.position; // Invert because lower position is better
      summary += `Average position ${formatChange(positionChange, true)} from ${previousGSCData.position.toFixed(1)} to ${currentGSCData.position.toFixed(1)}. `;
    }
  }
  
  return summary;
}

function calculateChanges(current: any, previous: any) {
  const changes = {
    sessions: ((current.sessions - previous.sessions) / previous.sessions) * 100,
    conversions: ((current.conversions - previous.conversions) / previous.conversions) * 100,
    revenue: ((current.revenue - previous.revenue) / previous.revenue) * 100,
  };
  return changes;
}

function calculateGSCChanges(current: any, previous: any) {
  const changes = {
    clicks: ((current.clicks - previous.clicks) / previous.clicks) * 100,
    impressions: ((current.impressions - previous.impressions) / previous.impressions) * 100,
    ctr: ((current.ctr - previous.ctr) / previous.ctr) * 100,
    position: previous.position - current.position,
  };
  return changes;
}

function formatDateRange(range: { start: Date; end: Date }) {
  return `${range.start.toLocaleDateString()} - ${range.end.toLocaleDateString()}`;
}
