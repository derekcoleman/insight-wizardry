import { extractChannelMetrics, extractTotalMetrics } from './ga4-service.ts';
import { extractGSCMetrics } from './gsc-service.ts';

const formatEventName = (eventName: string): string => {
  if (eventName === 'Total Events') return eventName;
  return eventName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export function analyzeTimePeriod(
  currentGA4Data: any, 
  previousGA4Data: any, 
  currentGSCData: any, 
  previousGSCData: any, 
  period: string, 
  currentDateRange: { start: Date; end: Date }, 
  previousDateRange: { start: Date; end: Date }
) {
  const metrics = {
    current: {
      ...extractTotalMetrics(currentGA4Data),
      ...(currentGSCData ? extractGSCMetrics(currentGSCData) : {}),
      conversionGoal: currentGA4Data?.conversionGoal || 'Total Conversions',
      channelGroupings: currentGA4Data?.channelGroupings || {}
    },
    previous: {
      ...extractTotalMetrics(previousGA4Data),
      ...(previousGSCData ? extractGSCMetrics(previousGSCData) : {}),
      conversionGoal: previousGA4Data?.conversionGoal || 'Total Conversions',
      channelGroupings: previousGA4Data?.channelGroupings || {}
    },
  };

  const changes = calculateChanges(metrics.current, metrics.previous);

  // Format the period string to include the date ranges
  const periodText = `${formatDate(currentDateRange.start)} to ${formatDate(currentDateRange.end)} vs ${formatDate(previousDateRange.start)} to ${formatDate(previousDateRange.end)}`;
  
  return {
    period: periodText,
    current: metrics.current,
    previous: metrics.previous,
    changes,
    summary: generateDetailedSummary(changes, metrics.current, metrics.previous, periodText),
    dataSources: {
      ga4: Boolean(currentGA4Data),
      gsc: Boolean(currentGSCData),
    },
  };
}

function calculateChanges(current: any, previous: any) {
  const changes: any = {};
  
  for (const key in current) {
    if (typeof current[key] === 'number' && typeof previous[key] === 'number') {
      changes[key] = previous[key] === 0 
        ? (current[key] > 0 ? 100 : 0)
        : ((current[key] - previous[key]) / previous[key]) * 100;
    }
  }
  
  return changes;
}

function formatChange(change: number, higherIsBetter: boolean = true) {
  if (!change || isNaN(change)) return "remained stable";
  
  const direction = change > 0 ? "increased" : "decreased";
  const goodBad = higherIsBetter ? 
    (change > 0 ? "improved" : "declined") : 
    (change > 0 ? "declined" : "improved");
  
  return `${direction} by ${Math.abs(change).toFixed(1)}% (${goodBad})`;
}

function formatDate(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function generateDetailedSummary(changes: any, current: any, previous: any, periodText: string) {
  let summary = `${periodText} Performance Analysis:\n\n`;
  
  // Get channel-specific metrics if they exist
  const channelMetrics = {
    current: current.channelGroupings?.organic_search || {},
    previous: previous.channelGroupings?.organic_search || {},
  };
  
  // Use channel metrics if they exist, otherwise fall back to total metrics
  const metricsToUse = channelMetrics.current.sessions !== undefined ? {
    current: channelMetrics.current,
    previous: channelMetrics.previous,
    changes: {
      sessions: ((channelMetrics.current.sessions - channelMetrics.previous.sessions) / channelMetrics.previous.sessions) * 100,
      conversions: ((channelMetrics.current.conversions - channelMetrics.previous.conversions) / channelMetrics.previous.conversions) * 100,
      revenue: ((channelMetrics.current.revenue - channelMetrics.previous.revenue) / channelMetrics.previous.revenue) * 100,
    }
  } : {
    current,
    previous,
    changes
  };
  
  // Traffic and Engagement
  summary += `Traffic and Engagement:\n`;
  if (metricsToUse.current.sessions !== undefined) {
    const sessionPrefix = channelMetrics.current.sessions !== undefined ? "Organic search" : "Total";
    summary += `${sessionPrefix} sessions ${formatChange(metricsToUse.changes.sessions, true)} from ${metricsToUse.previous.sessions.toLocaleString()} to ${metricsToUse.current.sessions.toLocaleString()}. `;
  }
  
  // Conversions
  if (metricsToUse.current.conversions > 0) {
    const conversionType = formatEventName(current.conversionGoal || 'Total Conversions');
    const conversionPrefix = channelMetrics.current.conversions !== undefined ? "Organic search" : "Total";
    summary += `\n\nConversions:\n${conversionPrefix} ${conversionType} ${formatChange(metricsToUse.changes.conversions, true)} from ${metricsToUse.previous.conversions.toLocaleString()} to ${metricsToUse.current.conversions.toLocaleString()}. `;
  }
  
  // Revenue
  if (metricsToUse.current.revenue > 0) {
    const revenuePrefix = channelMetrics.current.revenue !== undefined ? "Organic search" : "Total";
    summary += `\n\nRevenue:\n${revenuePrefix} revenue ${formatChange(metricsToUse.changes.revenue, true)} from $${metricsToUse.previous.revenue.toLocaleString()} to $${metricsToUse.current.revenue.toLocaleString()}. `;
  }
  
  // GSC Metrics if available
  if (current.clicks !== undefined) {
    summary += `\n\nSearch Console Performance:\n`;
    summary += `Clicks ${formatChange(changes.clicks, true)} from ${Math.round(previous.clicks).toLocaleString()} to ${Math.round(current.clicks).toLocaleString()}. `;
    summary += `Impressions ${formatChange(changes.impressions, true)} from ${Math.round(previous.impressions).toLocaleString()} to ${Math.round(current.impressions).toLocaleString()}. `;
    
    const currentCtr = current.ctr;
    const previousCtr = previous.ctr;
    if (!isNaN(currentCtr) && !isNaN(previousCtr)) {
      summary += `The click-through rate (CTR) ${formatChange(changes.ctr, true)} to ${currentCtr.toFixed(1)}%. `;
    }
    
    if (current.position !== undefined && previous.position !== undefined) {
      summary += `The average position ${formatChange(changes.position, false)} to ${current.position.toFixed(1)}. `;
    }
  }

  return summary;
}