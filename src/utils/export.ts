import { Platform, Share } from 'react-native';

export interface ExportData {
  summary: string;
  transcript: string;
  actionItems?: string[];
  keyDecisions?: string[];
  suggestions?: string[];
  date?: string;
}

export const exportTranscript = async (title: string, data: ExportData | string) => {
  let fullText = '';
  
  if (typeof data === 'string') {
    fullText = `Meeting: ${title}\n\n${data}`;
  } else {
    fullText = `# ${title}\n`;
    if (data.date) {
      fullText += `*Date: ${new Date(data.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}*\n\n`;
    }
    
    if (data.summary) {
      fullText += `## Executive Summary\n${data.summary}\n\n`;
    }
    
    if (data.keyDecisions && data.keyDecisions.length > 0) {
      fullText += `## Key Decisions\n`;
      data.keyDecisions.forEach(d => fullText += `- ${d}\n`);
      fullText += `\n`;
    }
    
    if (data.actionItems && data.actionItems.length > 0) {
      fullText += `## Action Items\n`;
      data.actionItems.forEach(a => fullText += `- [ ] ${a}\n`);
      fullText += `\n`;
    }
    
    if (data.suggestions && data.suggestions.length > 0) {
      fullText += `## Proactive Suggestions\n`;
      data.suggestions.forEach(s => fullText += `- ${s}\n`);
      fullText += `\n`;
    }
    
    if (data.transcript) {
      fullText += `## Full Transcript\n${data.transcript}\n`;
    }
  }
  
  if (Platform.OS === 'web') {
    // On Web, we create a Blob and trigger a file download
    try {
      const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // Clean up title for filename
      const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.setAttribute('href', url);
      link.setAttribute('download', `${safeTitle}_transcript.md`);
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error downloading file on web', e);
    }
  } else {
    // On native mobile, use the standard Share API
    try {
      await Share.share({
        message: fullText,
        title: `${title} - Export`
      });
    } catch (error) {
      console.log('Error sharing', error);
    }
  }
};
