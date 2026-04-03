/**
 * Subtitle Generation and Download Module
 * Handles SRT file generation from transcript data
 */

/**
 * Convert timestamp string (MM:SS or HH:MM:SS) to SRT format (HH:MM:SS,mmm)
 * @param {string} timestamp - Timestamp in format "MM:SS" or "HH:MM:SS"
 * @returns {string} - Timestamp in SRT format "HH:MM:SS,000"
 */
function convertToSRTTimestamp(timestamp) {
    const parts = timestamp.split(':');
    let hours = '00';
    let minutes = '00';
    let seconds = '00';
    
    if (parts.length === 2) {
        // Format: MM:SS
        minutes = parts[0].padStart(2, '0');
        seconds = parts[1].padStart(2, '0');
    } else if (parts.length === 3) {
        // Format: HH:MM:SS
        hours = parts[0].padStart(2, '0');
        minutes = parts[1].padStart(2, '0');
        seconds = parts[2].padStart(2, '0');
    }
    
    return `${hours}:${minutes}:${seconds},000`;
}

/**
 * Calculate end timestamp by adding duration to start timestamp
 * @param {string} startTime - Start timestamp
 * @param {number} duration - Duration in seconds (default 3)
 * @returns {string} - End timestamp in SRT format
 */
function calculateEndTimestamp(startTime, duration = 3) {
    const parts = startTime.split(':');
    let totalSeconds = 0;
    
    if (parts.length === 2) {
        totalSeconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    } else if (parts.length === 3) {
        totalSeconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    }
    
    totalSeconds += duration;
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},000`;
}

/**
 * Generate SRT content from transcript data
 * @param {Array} transcriptData - Array of transcript objects with timestamp and text
 * @returns {string} - SRT formatted subtitle content
 */
export function generateSRTContent(transcriptData) {
    if (!transcriptData || transcriptData.length === 0) {
        return '';
    }
    
    let srtContent = '';
    
    transcriptData.forEach((item, index) => {
        const sequenceNumber = index + 1;
        const startTime = convertToSRTTimestamp(item.timestamp);
        const endTime = calculateEndTimestamp(item.timestamp, 3);
        const text = item.text || '';
        
        srtContent += `${sequenceNumber}\n`;
        srtContent += `${startTime} --> ${endTime}\n`;
        srtContent += `${text}\n\n`;
    });
    
    return srtContent;
}

/**
 * Download SRT file
 * @param {string} srtContent - SRT formatted content
 * @param {string} filename - Name for the downloaded file
 */
export function downloadSRTFile(srtContent, filename = 'subtitles.srt') {
    // Create blob with SRT content
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Generate and download SRT file from current video transcript
 * @param {Object} video - Video object containing transcript data
 */
export function downloadSubtitles(video) {
    if (!video || !video.transcript || video.transcript.length === 0) {
        console.error('No transcript data available');
        alert('No transcript available for this video');
        return;
    }
    
    const srtContent = generateSRTContent(video.transcript);
    const filename = `${video.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_subtitles.srt`;
    
    downloadSRTFile(srtContent, filename);
}
