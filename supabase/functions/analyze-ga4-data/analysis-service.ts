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
  previousDateRange: { start: Date; end: Date },
  channelName: string = 'Overall'
) {
  const isOrganicSearch = channelName === 'Organic Search';
  
  const metrics = {
    current: {
      ...(isOrganicSearch 
        ? extractChannelMetrics(currentGA4Data, 'organic_search')
        : extractTotalMetrics(currentGA4Data)),
      ...(currentGSCData ? extractGSCMetrics(currentGSCData) : {}),
      conversionGoal: currentGA4Data?.conversionGoal || 'Total Conversions',
      channelGroupings: currentGA4Data?.channelGroupings || {}
    },
    previous: {
      ...(isOrganicSearch 
        ? extractChannelMetrics(previousGA4Data, 'organic_search')
        : extractTotalMetrics(previousGA4Data)),
      ...(previousGSCData ? extractGSCMetrics(previousGSCData) : {}),
      conversionGoal: previousGA4Data?.conversionGoal || 'Total Conversions',
      channelGroupings: previousGA4Data?.channelGroupings || {}
    },
  };

  const changes = calculateChanges(metrics.current, metrics.previous);

  const periodText = `${formatDate(currentDateRange.start)} to ${formatDate(currentDateRange.end)} vs ${formatDate(previousDateRange.start)} to ${formatDate(previousDateRange.end)}`;
  
  return {
    period: periodText,
    current: metrics.current,
    previous: metrics.previous,
    changes,
    summary: generateDetailedSummary(changes, metrics.current, metrics.previous, periodText, channelName),
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

function generateDetailedSummary(changes: any, current: any, previous: any, periodText: string, channelName: string = 'Overall') {
  let summary = `${periodText} Performance Analysis:\n\n`;
  const isOrganicSearch = channelName === 'Organic Search';
  
  // Traffic and Engagement
  summary += `Traffic and Engagement:\n`;
  if (isOrganicSearch) {
    const organicSessions = current.sessions;
    const previousOrganicSessions = previous.sessions;
    const organicSessionsChange = ((organicSessions - previousOrganicSessions) / previousOrganicSessions) * 100;
    summary += `Organic search sessions ${formatChange(organicSessionsChange, true)} from ${previousOrganicSessions.toLocaleString()} to ${organicSessions.toLocaleString()}. `;
  } else {
    summary += `Total sessions ${formatChange(changes.sessions, true)} from ${previous.sessions.toLocaleString()} to ${current.sessions.toLocaleString()}. `;
  }
  
  // Conversions
  if (current.conversions > 0) {
    const conversionType = formatEventName(current.conversionGoal || 'Total Conversions');
    summary += `\n\nConversions:\n`;
    if (isOrganicSearch) {
      summary += `Organic search ${conversionType} ${formatChange(changes.conversions, true)} from ${previous.conversions.toLocaleString()} to ${current.conversions.toLocaleString()}. `;
    } else {
      summary += `Total ${conversionType} ${formatChange(changes.conversions, true)} from ${previous.conversions.toLocaleString()} to ${current.conversions.toLocaleString()}. `;
    }
  }
  
  // Revenue
  if (current.revenue > 0) {
    summary += `\n\nRevenue:\n`;
    if (isOrganicSearch) {
      summary += `Organic search revenue ${formatChange(changes.revenue, true)} from $${previous.revenue.toLocaleString()} to $${current.revenue.toLocaleString()}. `;
    } else {
      summary += `Total revenue ${formatChange(changes.revenue, true)} from $${previous.revenue.toLocaleString()} to $${current.revenue.toLocaleString()}. `;
    }
  }
  
  // Channel-specific metrics for overall view
  if (!isOrganicSearch && current.channelGroupings) {
    summary += `\n\nChannel Performance:\n`;
    const channels = Object.keys(current.channelGroupings).filter(channel => channel !== 'total');
    
    channels.forEach(channel => {
      const currentChannel = current.channelGroupings[channel];
      const previousChannel = previous.channelGroupings?.[channel];
      
      if (currentChannel && previousChannel) {
        const sessionChange = ((currentChannel.sessions - previousChannel.sessions) / previousChannel.sessions) * 100;
        summary += `\n${channel.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: `;
        summary += `Sessions ${formatChange(sessionChange, true)} from ${previousChannel.sessions.toLocaleString()} to ${currentChannel.sessions.toLocaleString()}. `;
      }
    });
  }
  
  // GSC Metrics if available
  if (current.clicks !== undefined) {
    summary += `\n\nSearch Console Performance:\n`;
    if (isOrganicSearch) {
      summary += `Organic search clicks ${formatChange(changes.clicks, true)} from ${Math.round(previous.clicks).toLocaleString()} to ${Math.round(current.clicks).toLocaleString()}. `;
      summary += `Organic search impressions ${formatChange(changes.impressions, true)} from ${Math.round(previous.impressions).toLocaleString()} to ${Math.round(current.impressions).toLocaleString()}. `;
    } else {
      summary += `Clicks ${formatChange(changes.clicks, true)} from ${Math.round(previous.clicks).toLocaleString()} to ${Math.round(current.clicks).toLocaleString()}. `;
      summary += `Impressions ${formatChange(changes.impressions, true)} from ${Math.round(previous.impressions).toLocaleString()} to ${Math.round(current.impressions).toLocaleString()}. `;
    }
    
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