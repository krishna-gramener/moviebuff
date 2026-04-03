// Import subtitle functions
import { downloadSubtitles } from './subtitle.js';

// Landing Page Handler
document.addEventListener('DOMContentLoaded', () => {
    const startReviewBtn = document.getElementById('startReviewBtn');
    const landingPage = document.getElementById('landingPage');
    const mainApp = document.getElementById('mainApp');
    
    if (startReviewBtn) {
        startReviewBtn.addEventListener('click', () => {
            // Hide landing page
            landingPage.classList.add('hidden');
            // Show main app
            mainApp.classList.remove('hidden');
            // Load data if not already loaded
            if (videosData.length === 0) {
                loadData();
            }
        });
    }
});

// Global variables
let videosData = [];
let currentVideo = null;
let player = null;
let currentTab = 'content';
let processingSteps = [
    { id: 'step1', name: 'Extracting Audio', duration: 1000 },
    { id: 'step2', name: 'Generating Transcripts', duration: 2000 },
    { id: 'step3', name: 'Analyzing Video', duration: 1500 },
    { id: 'step4', name: 'Analyzing Sentiment', duration: 1000 },
    { id: 'step5', name: 'Generating Summary', duration: 1500 }
];
let currentStepIndex = 0;

// Load data.json
async function loadData() {
    try {
        console.log('Loading data from data.json...');
        const response = await fetch('data.json');
        videosData = await response.json();
        console.log('Data loaded successfully:', videosData.length, 'videos');
        renderVideoGrid();
        renderSidebar();
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Failed to load video data. Please ensure data.json exists and the app is running on a web server.');
    }
}

// Render video grid
function renderVideoGrid() {
    const grid = document.getElementById('videoGrid');
    if (!grid) {
        console.error('Video grid element not found!');
        return;
    }
    
    console.log('Rendering video grid with', videosData.length, 'videos');
    grid.innerHTML = '';
    
    videosData.forEach((video, index) => {
        const card = document.createElement('div');
        card.className = 'video-card-wrapper';
        
        // Extract video ID from YouTube URL
        const videoUrl = video.video_details.url || video.video_details.metadata.video_url;
        const videoTitle = video.video_details.title || video.video_details.metadata.title;
        const videoDuration = video.video_details.metadata.duration;
        const viewCount = video.video_details.metadata.view_count || 0;
        
        const videoId = extractVideoId(videoUrl);
        const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        
        // Format view count
        const formattedViews = viewCount >= 1000000 
            ? (viewCount / 1000000).toFixed(1) + 'M'
            : viewCount >= 1000 
            ? (viewCount / 1000).toFixed(1) + 'K'
            : viewCount.toString();
        
        // Build regional details
        const regionalRecs = video.video_details.regional_recommendations || {};
        const countries = [
            { code: 'india', flag: '🇮🇳', name: 'India' },
            { code: 'united_states', flag: '🇺🇸', name: 'USA' },
            { code: 'france', flag: '🇫🇷', name: 'France' },
            { code: 'japan', flag: '🇯🇵', name: 'Japan' }
        ];
        
        // Build horizontal table with region-wise review stages
        const expandedTableHTML = `
            <table class="review-stages-table">
                <thead>
                    <tr>
                        <th class="stage-header">Region</th>
                        <th class="stage-header">AI Rating</th>
                        <th class="stage-header">Human Rating</th>
                        <th class="stage-header">Reviewer</th>
                        <th class="stage-header">Final Rating</th>
                    </tr>
                </thead>
                <tbody>
                    ${countries.map(country => {
                        const region = regionalRecs[country.code] || {};
                        const aiRating = (region.rating_suggestion || 'N/A').slice(0, 5);
                        const humanRating = (region.human_rating || '').slice(0, 5);
                        const reviewer = region.reviewer || '-';
                        const finalRating = region.final_rating ? region.final_rating.slice(0, 5) : '';
                        const isPending = !region.final_rating || region.final_rating === '';
                        
                        return `
                            <tr class="review-stage-row">
                                <td class="region-cell">
                                    <span class="region-flag-table">${country.flag}</span>
                                    <span class="region-name-table">${country.name}</span>
                                </td>
                                <td class="rating-cell">
                                    <span class="rating-badge-table ai-badge">${aiRating}</span>
                                </td>
                                <td class="rating-cell">
                                    <span class="rating-badge-table human-badge">${humanRating}</span>
                                </td>
                                <td class="reviewer-cell">
                                    <span class="reviewer-text">${reviewer}</span>
                                </td>
                                <td class="rating-cell">
                                    <span class="rating-badge-table ${isPending ? 'pending-badge' : 'final-badge'}">${isPending ? 'Pending' : finalRating}</span>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
        
        card.innerHTML = `
            <div class="video-card-main" data-video-index="${index}">
                <button class="expand-arrow-btn" onclick="toggleExpandDetails(event, ${index})" title="Show Details">
                    <span class="arrow-icon">▶</span>
                </button>
                <div class="video-card-thumbnail">
                    <img src="${thumbnailUrl}" alt="${videoTitle}" 
                         onerror="this.src='https://img.youtube.com/vi/${videoId}/0.jpg'">
                </div>
                <div class="video-card-content">
                    <h3 class="video-card-title">${videoTitle}</h3>
                    <div class="video-card-meta-row">
                        <div class="video-card-duration">${formatDuration(videoDuration)}</div>
                        <div class="video-card-views">${formattedViews} views</div>
                    </div>
                </div>
            </div>
            <div class="video-card-expanded" id="expanded-details-${index}">
                ${expandedTableHTML}
            </div>
        `;
        
        // Add click handler to the main card area
        const cardMain = card.querySelector('.video-card-main');
        cardMain.addEventListener('click', (e) => {
            // Don't trigger if clicking the arrow button
            if (!e.target.closest('.expand-arrow-btn')) {
                selectVideo(video);
            }
        });
        
        grid.appendChild(card);
    });
}

// Render sidebar
function renderSidebar() {
    const sidebarList = document.getElementById('sidebarVideoList');
    sidebarList.innerHTML = '';
    
    videosData.forEach((video, index) => {
        const item = document.createElement('div');
        item.className = 'sidebar-video-item';
        item.onclick = () => {
            selectVideo(video);
            toggleSidebar();
        };
        
        const videoUrl = video.video_details.url || video.video_details.metadata.video_url;
        const videoTitle = video.video_details.title || video.video_details.metadata.title;
        const videoDuration = video.video_details.metadata.duration;
        
        const videoId = extractVideoId(videoUrl);
        const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/default.jpg`;
        
        item.innerHTML = `
            <img src="${thumbnailUrl}" alt="${videoTitle}" class="w-full rounded-lg mb-2">
            <h4 class="text-sm font-semibold" style="color: #2d3748;">${videoTitle}</h4>
            <p class="text-xs" style="color: #4a5568;">${formatDuration(videoDuration)}</p>
        `;
        
        sidebarList.appendChild(item);
    });
}

// Toggle sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const arrow = document.getElementById('sidebarArrow');
    const isOpen = sidebar.classList.toggle('open');
    
    // Update arrow direction
    if (isOpen) {
        arrow.textContent = '←';
    } else {
        arrow.textContent = '→';
    }
}

// Extract YouTube video ID from URL
function extractVideoId(url) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
}

// Format duration from seconds to HH:MM:SS or MM:SS
function formatDuration(duration) {
    // Handle string format like "08:41" or "09:01"
    if (typeof duration === 'string') {
        return duration;
    }
    
    // Handle numeric seconds
    const seconds = parseInt(duration);
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Format timestamp for display (MM:SS)
function formatTimestamp(timestamp) {
    // If already a string in format "00:00:00", return as is
    if (typeof timestamp === 'string') {
        return timestamp;
    }
    
    // Convert numeric seconds to MM:SS format
    const seconds = parseFloat(timestamp);
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Convert time string to seconds
function convertTimeToSeconds(timeString) {
    // If already a number, return it
    if (typeof timeString === 'number') {
        return timeString;
    }
    
    // Parse time format like "00:01:36" or "01:36"
    const parts = timeString.split(':').map(p => parseInt(p));
    
    if (parts.length === 3) {
        // HH:MM:SS format
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
        // MM:SS format
        return parts[0] * 60 + parts[1];
    }
    
    return 0;
}

// Select a video
function selectVideo(video) {
    currentVideo = video;
    currentTab = 'content';
    currentStepIndex = 0;
    
    // Hide main app header
    const mainAppHeader = document.getElementById('mainAppHeader');
    if (mainAppHeader) {
        mainAppHeader.classList.add('hidden');
    }
    
    // Hide video library section (including header and tabs)
    const videoLibrarySection = document.getElementById('videoLibrarySection');
    if (videoLibrarySection) {
        videoLibrarySection.classList.add('hidden');
    }
    
    // Hide video grid
    document.getElementById('videoGrid').classList.add('hidden');
    
    // Show video player section
    const videoPlayer = document.getElementById('videoPlayer');
    videoPlayer.classList.remove('hidden');
    
    // Show sidebar toggle button
    document.getElementById('sidebarToggle').classList.remove('hidden');
    
    // Update sidebar active state
    updateSidebarActiveState();
    
    // Get video details
    const videoUrl = video.video_details.url || video.video_details.metadata.video_url;
    const videoTitle = video.video_details.title || video.video_details.metadata.title;
    const genres = video.video_details.genres || [];
    const metadata = video.video_details.metadata || {};
    
    // Update breadcrumb and title
    const breadcrumbTitle = document.getElementById('breadcrumbTitle');
    const videoTitleText = document.getElementById('videoTitleText');
    if (breadcrumbTitle) breadcrumbTitle.textContent = videoTitle;
    if (videoTitleText) videoTitleText.textContent = videoTitle;
    
    // Update metadata section
    const videoMetadata = document.getElementById('videoMetadata');
    if (videoMetadata) {
        const genreText = genres.length > 0 ? genres.map(g => g.genre).slice(0, 2).join(', ') : 'N/A';
        const publishDate = metadata.publish_date || 'N/A';
        const duration = metadata.duration || 'N/A';
        
        videoMetadata.innerHTML = `
            <span class="metadata-item"><strong>Genre:</strong> ${genreText}</span>
            <span class="metadata-separator">|</span>
            <span class="metadata-item"><strong>Duration:</strong> ${duration}</span>
            <span class="metadata-separator">|</span>
            <span class="metadata-item"><strong>Published:</strong> ${publishDate}</span>
        `;
    }
    
    // Show progress bar section, hide main content
    document.getElementById('progressBarSection').classList.remove('hidden');
    document.getElementById('mainContent').classList.add('hidden');
    
    // Reset progress
    resetProgress();
    
    // Start processing automatically
    setTimeout(() => {
        startProcessing();
    }, 500);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Reset progress bar and steps
function resetProgress() {
    currentStepIndex = 0;
    document.getElementById('progressFill').style.width = '0%';
    document.getElementById('progressPercent').textContent = '0%';
    document.getElementById('progressText').textContent = 'Initializing...';
    
    // Reset all steps
    processingSteps.forEach(step => {
        const stepEl = document.getElementById(step.id);
        stepEl.classList.remove('active', 'completed');
    });
}

// Start processing workflow
async function startProcessing() {
    for (let i = 0; i < processingSteps.length; i++) {
        currentStepIndex = i;
        await processStep(i);
    }
    
    // All steps completed - show main content
    completeProcessing();
}

// Process a single step
function processStep(stepIndex) {
    return new Promise((resolve) => {
        const step = processingSteps[stepIndex];
        const stepEl = document.getElementById(step.id);
        
        // Mark current step as active
        stepEl.classList.add('active');
        
        // Update progress text
        document.getElementById('progressText').textContent = step.name + '...';
        
        // Calculate progress percentage
        const progress = ((stepIndex + 1) / processingSteps.length) * 100;
        
        // Animate progress bar
        setTimeout(() => {
            document.getElementById('progressFill').style.width = progress + '%';
            document.getElementById('progressPercent').textContent = Math.round(progress) + '%';
        }, 100);
        
        // Simulate processing time
        setTimeout(() => {
            // Mark step as completed
            stepEl.classList.remove('active');
            stepEl.classList.add('completed');
            
            // Clear the number from completed step icon
            const stepIcon = stepEl.querySelector('.step-icon');
            stepIcon.textContent = '';
            
            resolve();
        }, step.duration);
    });
}

// Complete processing and show content
function completeProcessing() {
    // Hide progress bar section
    document.getElementById('progressBarSection').classList.add('hidden');
    
    // Show main content
    document.getElementById('mainContent').classList.remove('hidden');
    
    // Create YouTube player
    const videoUrl = currentVideo.video_details.url || currentVideo.video_details.metadata.video_url;
    const videoId = extractVideoId(videoUrl);
    createPlayer(videoId);
    
    // Load transcript
    loadTranscript();
    
    // Load analysis data
    loadAnalysisData();
    
    // Populate new analysis results interface
    populateAnalysisResults();
}

// Load transcript into the transcript tab (legacy - now handled by populateTranscriptTab)
function loadTranscript() {
    // This function is kept for backward compatibility but transcript is now
    // populated by populateTranscriptTab() which is called from populateAnalysisResults()
    console.log('loadTranscript called - transcript is now handled by populateTranscriptTab');
}

// Load analysis data into respective tabs (legacy - now handled by new populate functions)
function loadAnalysisData() {
    // This function is kept for backward compatibility
    // Data is now populated by populateLeftSideTabs(), populateAnalysisResults(), etc.
    console.log('loadAnalysisData called - data is now handled by new populate functions');
}

// Load regional recommendations
function loadRegionalRecommendations(region) {
    const regionalContent = document.getElementById('regionalContent');
    const regionalData = currentVideo.video_details.regional_recommendations;
    
    if (!regionalData || !regionalData[region]) {
        regionalContent.innerHTML = '<p style="color: #718096;">No regional recommendations available for this region.</p>';
        return;
    }
    
    const data = regionalData[region];
    const cardClass = data.changes_required ? 'changes-required' : 'no-changes';
    const badgeClass = data.changes_required ? 'changes-required' : 'no-changes';
    const badgeText = data.changes_required ? 'Changes Required' : 'No Changes Required';
    
    // Format region name for display
    const regionNames = {
        'india': 'India',
        'france': 'France',
        'japan': 'Japan',
        'united_states': 'United States'
    };
    const displayName = regionNames[region] || region;
    
    const recommendationsHTML = data.recommendations.map(rec => `<li>${rec}</li>`).join('');
    
    regionalContent.innerHTML = `
        <div class="regional-card ${cardClass}">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-xl font-bold mb-2" style="color: #2d3748;">Region: ${displayName}</h3>
                    <p class="text-sm" style="color: #718096;">Suggested Rating: <span class="font-semibold" style="color: #2d3748;">${data.rating_suggestion}</span></p>
                </div>
                <span class="regional-badge ${badgeClass}">${badgeText}</span>
            </div>
            
            <div class="mt-4">
                <h4 class="font-semibold mb-3" style="color: #2d3748;">Recommendations:</h4>
                <ul class="recommendation-list">
                    ${recommendationsHTML}
                </ul>
            </div>
        </div>
    `;
}

// Populate Analysis Results (New Interface)
function populateAnalysisResults() {
    const analysisResults = document.getElementById('analysisResults');
    const categoryFilters = document.getElementById('categoryFilters');
    if (!analysisResults || !currentVideo) return;
    
    const category = currentVideo.video_details.category;
    const contentAnalysis = category.content_analysis || [];
    
    if (contentAnalysis.length === 0) {
        analysisResults.innerHTML = '<div style="text-align: center; padding: 40px; color: #94a3b8;">No content alerts found for this video.</div>';
        if (categoryFilters) categoryFilters.innerHTML = '';
        return;
    }
    
    // Define all standard categories
    const standardCategories = [
        'Suggestive Dialogue',
        'Coarse Language',
        'Sexual Content',
        'Violence',
        'Others'
    ];
    
    // Create category filter buttons - always show all 5 categories
    if (categoryFilters) {
        const categoryCounts = {};
        categoryCounts['all'] = contentAnalysis.length;
        
        // Count occurrences for each standard category
        standardCategories.forEach(type => {
            categoryCounts[type.toLowerCase().replace(/\s+/g, '-')] = contentAnalysis.filter(a => a.alert_type === type).length;
        });
        
        // Sort categories by count (descending)
        const sortedCategories = [...standardCategories].sort((a, b) => {
            const countA = categoryCounts[a.toLowerCase().replace(/\s+/g, '-')] || 0;
            const countB = categoryCounts[b.toLowerCase().replace(/\s+/g, '-')] || 0;
            return countB - countA; // Descending order
        });
        
        let filtersHTML = `
            <button class="category-btn active" data-category="all">
                All <span class="category-count">${categoryCounts['all']}</span>
            </button>
        `;
        
        // Always show all 5 standard categories, ordered by count
        sortedCategories.forEach(type => {
            const categoryKey = type.toLowerCase().replace(/\s+/g, '-');
            const count = categoryCounts[categoryKey] || 0;
            filtersHTML += `
                <button class="category-btn" data-category="${categoryKey}" data-alert-type="${type}">
                    ${type} <span class="category-count">${count}</span>
                </button>
            `;
        });
        
        categoryFilters.innerHTML = filtersHTML;
    }
    
    // Generate analysis items with approve/reject buttons
    const analysisHTML = contentAnalysis.map((alert, index) => {
        const seconds = convertTimeToSeconds(alert.timestamp);
        const categoryClass = alert.alert_type.toLowerCase().replace(/\s+/g, '-');
        
        // Check if this alert has been reviewed
        const isReviewed = alert.review_status !== undefined;
        const reviewStatus = alert.review_status || null;
        
        return `
            <div class="analysis-item" data-category="${categoryClass}" data-alert-index="${index}">
                <div class="analysis-item-header">
                    <a href="#" class="analysis-timestamp" onclick="seekTo(${seconds}); return false;">
                        ${formatTimestamp(alert.timestamp)}
                    </a>
                    <span class="analysis-category">${alert.alert_type}</span>
                </div>
                <div class="analysis-item-content">
                    ${alert.description}
                </div>
                <div class="analysis-item-actions">
                    ${isReviewed ? `
                        <div class="review-status ${reviewStatus}">
                            ${reviewStatus === 'approved' ? '✓ Approved' : '✗ Rejected'}
                            ${alert.review_comment ? `<span class="review-comment-preview" title="${alert.review_comment}"></span>` : ''}
                        </div>
                    ` : `
                        <button class="action-btn action-btn-icon approve-btn" onclick="openReviewModal(${index}, 'approved'); return false;" title="Approve">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M13.5 4L6 11.5L2.5 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                        <button class="action-btn action-btn-icon reject-btn" onclick="openReviewModal(${index}, 'rejected'); return false;" title="Reject">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </button>
                    `}
                </div>
            </div>
        `;
    }).join('');
    
    analysisResults.innerHTML = analysisHTML;
    
    // Update alert count in tab badge
    updateAlertCount(contentAnalysis.length);
    
    // Populate other tabs
    populateTranscriptTab();
    populateLeftSideTabs();
    populateRegionalTab();
    populateHistoryTab();
}

// Populate Transcript Tab
function populateTranscriptTab() {
    const transcriptContent = document.getElementById('transcriptContent');
    if (!transcriptContent || !currentVideo) return;
    
    const segments = currentVideo.video_details.segments || [];
    
    if (segments.length === 0) {
        transcriptContent.innerHTML = '<div style="text-align: center; padding: 40px; color: #94a3b8;">No transcript available.</div>';
        return;
    }
    
    // Download button HTML
    const downloadButtonHTML = `
        <div class="transcript-download-container">
            <button class="download-subtitle-btn" onclick="handleDownloadSubtitles(); return false;">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M8 1v10M8 11l-3-3M8 11l3-3M2 14h12" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Download Subtitles (.srt)
            </button>
        </div>
    `;
    
    const transcriptHTML = segments.map(segment => {
        const timestamp = formatDuration(segment.start);
        const seconds = Math.floor(segment.start);
        
        return `
            <div class="transcript-item" data-start="${segment.start}" data-end="${segment.end}">
                <a href="#" class="transcript-timestamp" onclick="seekTo(${seconds}); return false;">
                    ${timestamp}
                </a>
                <p class="transcript-text">${segment.text}</p>
            </div>
        `;
    }).join('');
    
    transcriptContent.innerHTML = downloadButtonHTML + transcriptHTML;
}

// Populate Left Side Tabs (Summary and Genres)
function populateLeftSideTabs() {
    if (!currentVideo) return;
    
    const videoDetails = currentVideo.video_details;
    const summary = videoDetails.detailed_summary || videoDetails.summary || 'No summary available.';
    const genres = videoDetails.genres || [];
    const rating = videoDetails.category.rating || 'Not Rated';
    const sentiment = videoDetails.smart_features?.sentiment_analysis || '';
    const duration = videoDetails.metadata?.duration || '';
    const regionalRecs = videoDetails.regional_recommendations || {};
    
    // Summary Tab Content - Country-specific
    const summaryContentLeft = document.getElementById('summaryContentLeft');
    if (summaryContentLeft) {
        // Get mood tags if available
        const moodTags = videoDetails.smart_features?.mood_tags || [];
        const moodTagsHTML = moodTags.length > 0 ? moodTags.map(tag => 
            `<span style="display: inline-block; background: #1e293b; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; margin-right: 8px; text-transform: uppercase;">${tag}</span>`
        ).join('') : '';
        
        // Country flags and data
        const countries = [
            { code: 'united_states', flag: '🇺🇸', name: 'United States' },
            { code: 'india', flag: '🇮🇳', name: 'India' },
            { code: 'france', flag: '🇫🇷', name: 'France' },
            { code: 'japan', flag: '🇯🇵', name: 'Japan' }
        ];
        
        // Default to India
        const defaultCountry = 'united_states';
        const currentRegion = regionalRecs[defaultCountry] || {};
        const currentRating = currentRegion.rating_suggestion || rating;
        const currentSummary = currentRegion.summary || summary;
        
        // Get AI and Human ratings (region-specific)
        const aiRating = currentRating; // Region-specific AI rating
        const humanRating = currentRegion.human_rating || currentRating; // Region-specific human rating
        const ratingApproved = videoDetails.rating_approved || false;
        
        // Debug logging
        console.log('Rating Debug:', {
            aiRating: aiRating,
            humanRating: humanRating,
            categoryRating: videoDetails.category.rating,
            humanRatingField: videoDetails.category.human_rating
        });
        
        summaryContentLeft.innerHTML = `
            <div style="background: white; border-radius: 12px; padding: 32px; border: 1px solid rgba(174, 183, 132, 0.2);">
                <h3 style="font-size: 26px; font-weight: 700; color: #1e3a8a; margin: 0 0 20px 0;">Summary</h3>
                
                <!-- Country Selector -->
                <div style="display: flex; gap: 8px; margin-bottom: 24px; padding: 12px; background: rgba(174, 183, 132, 0.05); border-radius: 8px; border: 1px solid rgba(174, 183, 132, 0.15);">
                    ${countries.map(country => `
                        <button 
                            class="summary-country-btn ${country.code === defaultCountry ? 'active' : ''}" 
                            data-country="${country.code}"
                            title="${country.name}"
                            style="background: ${country.code === defaultCountry ? 'rgba(30, 58, 138, 0.05)' : 'white'}; border: 2px solid ${country.code === defaultCountry ? '#1e3a8a' : 'rgba(174, 183, 132, 0.3)'}; padding: 8px 12px; border-radius: 6px; font-size: 24px; cursor: pointer; transition: all 0.2s; min-width: 50px; display: flex; align-items: center; justify-content: center;">
                            ${country.flag}
                        </button>
                    `).join('')}
                </div>
                
                <!-- Rating Comparison -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                    <div style="padding: 16px; background: rgba(59, 130, 246, 0.05); border-radius: 8px; border: 2px solid rgba(59, 130, 246, 0.2);">
                        <div style="font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">AI Rating</div>
                        <div id="aiRatingDisplay" style="font-size: 20px; font-weight: 700; color: #3b82f6;">
                            ${currentRating.split('(')[0].trim()}
                        </div>
                    </div>
                    <div style="padding: 16px; background: rgba(16, 185, 129, 0.05); border-radius: 8px; border: 2px solid rgba(16, 185, 129, 0.2);">
                        <div style="font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Human Rating</div>
                        <div id="humanRatingDisplay" style="font-size: 20px; font-weight: 700; color: #10b981;">
                            ${humanRating.split('(')[0].trim()}
                        </div>
                    </div>
                </div>
                
                <!-- Rating Actions -->
                <div id="ratingActionsSection" style="display: flex; gap: 12px; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                    ${ratingApproved ? `
                        <div class="review-status approved" style="display: inline-flex;">
                            ✓ Rating Approved
                        </div>
                    ` : `
                        <button class="action-btn-compact override-btn" onclick="openRatingOverrideModal(); return false;">
                            Override
                        </button>
                        <button class="action-btn-compact approve-btn" onclick="approveCurrentRating(); return false;">
                            Approve
                        </button>
                    `}
                </div>
                
                ${sentiment ? `<p style="font-size: 14px; font-weight: 700; color: #1e3a8a; margin: 0 0 20px 0; text-transform: uppercase; letter-spacing: 0.5px;">${sentiment}</p>` : ''}
                ${moodTagsHTML ? `<div style="margin-bottom: 20px;">${moodTagsHTML}</div>` : ''}
                
                <!-- Country-specific summary -->
                <p id="countrySummaryText" style="font-size: 15px; line-height: 1.8; color: #475569; margin-bottom: 20px;">${currentSummary}</p>
                
                ${duration ? `<p style="font-size: 14px; color: #64748b; margin: 0 0 20px 0;"><strong>Video Length:</strong> ${duration}</p>` : ''}
                
                <!-- Summary Review Actions -->
                <div class="summary-review-section" id="summaryReviewSection">
                    ${videoDetails.summary_review_status ? `
                        <div class="review-status ${videoDetails.summary_review_status}" style="display: inline-flex;">
                            ${videoDetails.summary_review_status === 'approved' ? '✓ Summary Approved' : '✗ Summary Rejected'}
                            ${videoDetails.summary_review_comment ? `<span class="review-comment-preview" title="${videoDetails.summary_review_comment}"></span>` : ''}
                        </div>
                    ` : `
                        <div style="display: flex; gap: 12px; padding-top: 12px; border-top: 1px solid rgba(174, 183, 132, 0.2);">
                            <button class="action-btn-compact approve-btn" onclick="openSummaryReviewModal('approved'); return false;">
                                Approve
                            </button>
                            <button class="action-btn-compact reject-btn" onclick="openSummaryReviewModal('rejected'); return false;">
                                Reject
                            </button>
                        </div>
                    `}
                </div>
            </div>
        `;
        
        // Add event listeners for country buttons
        document.querySelectorAll('.summary-country-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const selectedCountry = this.dataset.country;
                updateSummaryForCountry(selectedCountry);
            });
        });
    }
    
    // Genres Tab Content
    const genresContentLeft = document.getElementById('genresContentLeft');
    if (genresContentLeft && genres.length > 0) {
        const genresHTML = genres.map(genre => {
            const confidence = Math.round((genre.confidence_score || genre.confidence || 0) * 100);
            return `
                <div style="margin-bottom: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-weight: 600; font-size: 15px; color: #1e293b;">${genre.genre}</span>
                        <span style="font-size: 13px; font-weight: 600; color: #2563eb;">${confidence}%</span>
                    </div>
                    <div style="width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                        <div style="height: 100%; background: linear-gradient(90deg, #2563eb, #3b82f6); width: ${confidence}%; transition: width 0.5s;"></div>
                    </div>
                    ${genre.reasoning ? `<p style="font-size: 13px; color: #64748b; margin-top: 8px;">${genre.reasoning}</p>` : ''}
                </div>
            `;
        }).join('');
        
        genresContentLeft.innerHTML = `
            ${genresHTML}
        `;
    }
}

// Update summary for selected country
function updateSummaryForCountry(countryCode) {
    if (!currentVideo) return;
    
    const videoDetails = currentVideo.video_details;
    const summary = videoDetails.detailed_summary || videoDetails.summary || 'No summary available.';
    const rating = videoDetails.category.rating || 'Not Rated';
    const regionalRecs = videoDetails.regional_recommendations || {};
    const currentRegion = regionalRecs[countryCode] || {};
    const currentRating = currentRegion.rating_suggestion || rating;
    const currentSummary = currentRegion.summary || summary;
    
    // Get region-specific human rating
    const humanRating = currentRegion.human_rating || currentRating;
    
    // Update AI rating display (country-specific)
    const aiRatingDisplay = document.getElementById('aiRatingDisplay');
    if (aiRatingDisplay) {
        aiRatingDisplay.textContent = currentRating.split('(')[0].trim();
    }
    
    // Update Human rating display (stays same across countries)
    const humanRatingDisplay = document.getElementById('humanRatingDisplay');
    if (humanRatingDisplay) {
        humanRatingDisplay.textContent = humanRating.split('(')[0].trim();
    }
    
    // Update summary text
    const summaryText = document.getElementById('countrySummaryText');
    if (summaryText) {
        summaryText.textContent = currentSummary;
    }
    
    // Update active button state
    document.querySelectorAll('.summary-country-btn').forEach(btn => {
        if (btn.dataset.country === countryCode) {
            btn.classList.add('active');
            btn.style.borderColor = '#1e3a8a';
            btn.style.background = 'rgba(30, 58, 138, 0.05)';
        } else {
            btn.classList.remove('active');
            btn.style.borderColor = 'rgba(174, 183, 132, 0.3)';
            btn.style.background = 'white';
        }
    });
}

// Populate Regional Tab
function populateRegionalTab() {
    if (!currentVideo) return;
    
    // Load default region (India)
    loadRegionalRecommendationsNew('india');
}

// Load Regional Recommendations (New)
function loadRegionalRecommendationsNew(region) {
    const regionalContentNew = document.getElementById('regionalContentNew');
    if (!regionalContentNew) return;
    
    const regionalData = currentVideo.video_details.regional_recommendations;
    
    if (!regionalData || !regionalData[region]) {
        regionalContentNew.innerHTML = '<div style="text-align: center; padding: 40px; color: #94a3b8;">No regional recommendations available for this region.</div>';
        return;
    }
    
    const data = regionalData[region];
    const regionNames = {
        'india': 'India',
        'france': 'France',
        'japan': 'Japan',
        'united_states': 'United States'
    };
    const displayName = regionNames[region] || region;
    
    let html = `
        <div style="background: white; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h3 style="font-size: 18px; font-weight: 700; color: #1e293b; margin: 0;">
                    ${displayName}
                </h3>
                <span style="padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; background: ${data.changes_required ? '#fef2f2' : '#f0fdf4'}; color: ${data.changes_required ? '#ef4444' : '#10b981'}; border: 1px solid ${data.changes_required ? '#ef4444' : '#10b981'};">
                    ${data.changes_required ? 'Changes Required' : 'No Changes Required'}
                </span>
            </div>
            ${data.rating_suggestion ? `
                <div style="background: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #2563eb; margin-bottom: 16px;">
                    <p style="font-size: 13px; font-weight: 600; color: #64748b; margin: 0 0 4px 0;">Suggested Rating:</p>
                    <p style="font-size: 16px; font-weight: 700; color: #1e293b; margin: 0;">${data.rating_suggestion}</p>
                </div>
            ` : ''}
    `;
    
    if (data.recommendations && data.recommendations.length > 0) {
        html += `
            <h4 style="font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 12px;">Recommendations:</h4>
            <ul style="list-style: none; padding: 0; margin: 0;">
        `;
        
        data.recommendations.forEach(rec => {
            html += `
                <li style="padding: 12px; background: #f8fafc; border-radius: 6px; margin-bottom: 8px; border-left: 3px solid #2563eb;">
                    <p style="font-size: 14px; color: #475569; margin: 0;">${rec}</p>
                </li>
            `;
        });
        
        html += '</ul>';
    }
    
    html += '</div>';
    regionalContentNew.innerHTML = html;
}

// Populate History Tab
function populateHistoryTab() {
    const historyContentNew = document.getElementById('historyContentNew');
    if (!historyContentNew || !currentVideo) return;
    
    const historyLogs = currentVideo.video_details.history_logs || [];
    
    if (historyLogs.length === 0) {
        historyContentNew.innerHTML = '<div style="text-align: center; padding: 40px; color: #94a3b8;">No history logs available.</div>';
        return;
    }
    
    const historyHTML = historyLogs.map(log => {
        const statusBadgeColor = log.status === 'approved' ? '#10b981' : log.status === 'rejected' ? '#ef4444' : '#6b7280';
        const statusBadgeText = log.status ? log.status.charAt(0).toUpperCase() + log.status.slice(1) : '';
        
        return `
            <div style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 16px; border: 1px solid #e2e8f0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <div>
                        <span style="font-weight: 700; font-size: 15px; color: #1e293b;">${log.action}</span>
                        ${statusBadgeText ? `<span style="display: inline-block; margin-left: 12px; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; background: ${statusBadgeColor}; color: white;">${statusBadgeText}</span>` : ''}
                    </div>
                    <span style="font-size: 13px; color: #64748b;">${log.timestamp}</span>
                </div>
                ${log.message ? `<p style="font-size: 14px; color: #475569; margin: 0; margin-bottom: 8px;">${log.message}</p>` : ''}
                ${log.user ? `<p style="font-size: 13px; color: #94a3b8; margin: 0;">By: ${log.user}</p>` : ''}
            </div>
        `;
    }).join('');
    
    historyContentNew.innerHTML = historyHTML;
}

// Update category counts in filter buttons
// Update alert count in tab (for the "Content Alerts" tab badge)
function updateAlertCount(count) {
    const alertCount = document.getElementById('alertCount');
    if (alertCount) {
        alertCount.textContent = count;
    }
}

// Update sidebar active state
function updateSidebarActiveState() {
    const items = document.querySelectorAll('.sidebar-video-item');
    items.forEach((item, index) => {
        if (videosData[index] === currentVideo) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// YouTube IFrame API ready callback
function onYouTubeIframeAPIReady() {
    // Player will be created when a video is selected
}

// Create YouTube player
function createPlayer(videoId) {
    // Destroy existing player if any
    if (player && player.destroy) {
        player.destroy();
    }
    
    // Remove old player div if exists
    const oldPlayerDiv = document.getElementById('player');
    if (oldPlayerDiv) {
        oldPlayerDiv.remove();
    }
    
    // Create new player div
    const playerDiv = document.createElement('div');
    playerDiv.id = 'player';
    playerDiv.className = 'w-full aspect-video rounded-xl overflow-hidden';
    
    const wrapper = document.getElementById('playerWrapper');
    if (wrapper) {
        wrapper.appendChild(playerDiv);
    }
    
    // Create YouTube player
    player = new YT.Player('player', {
        videoId: videoId,
        playerVars: {
            'playsinline': 1,
            'rel': 0
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

// Player state change callback
let transcriptUpdateInterval = null;

function onPlayerStateChange(event) {
    console.log('Player state changed:', event.data);
    // YT.PlayerState.PLAYING = 1
    if (event.data === 1) {
        console.log('Video playing - starting transcript tracking');
        // Start tracking transcript
        if (transcriptUpdateInterval) {
            clearInterval(transcriptUpdateInterval);
        }
        transcriptUpdateInterval = setInterval(updateActiveTranscript, 200);
    } else {
        console.log('Video paused/stopped - stopping transcript tracking');
        // Stop tracking when paused or ended
        if (transcriptUpdateInterval) {
            clearInterval(transcriptUpdateInterval);
            transcriptUpdateInterval = null;
        }
    }
}

// Update active transcript line based on current video time
function updateActiveTranscript() {
    if (!player || !player.getCurrentTime) {
        return;
    }
    
    const currentTime = player.getCurrentTime();
    const transcriptItems = document.querySelectorAll('.transcript-item');
    
    if (transcriptItems.length === 0) {
        return;
    }
    
    transcriptItems.forEach(item => {
        const startTime = parseFloat(item.dataset.start);
        const endTime = parseFloat(item.dataset.end);
        
        if (currentTime >= startTime && currentTime < endTime) {
            item.classList.add('active');
            // Auto-scroll within the transcript container only (not the whole page)
            const container = document.getElementById('transcriptContent');
            if (container) {
                // Calculate position relative to container
                const containerRect = container.getBoundingClientRect();
                const itemRect = item.getBoundingClientRect();
                const scrollOffset = itemRect.top - containerRect.top - (containerRect.height / 2) + (itemRect.height / 2);
                
                // Scroll only the container, not the page
                container.scrollBy({ 
                    top: scrollOffset, 
                    behavior: 'smooth' 
                });
            }
        } else {
            item.classList.remove('active');
        }
    });
}

// Player ready callback
function onPlayerReady(event) {
    console.log('Player ready');
}

// Seek to specific time
function seekTo(seconds) {
    if (player && player.seekTo) {
        player.seekTo(seconds, true);
        player.playVideo();
    }
}

// Back button handler
// document.getElementById('backBtn').addEventListener('click', () => {
//     currentVideo = null;
//     
//     // Show main app header
//     const mainAppHeader = document.getElementById('mainAppHeader');
//     if (mainAppHeader) {
//         mainAppHeader.classList.remove('hidden');
//     }
//     
//     // Show video library section (including header and tabs)
//     const videoLibrarySection = document.getElementById('videoLibrarySection');
//     if (videoLibrarySection) {
//         videoLibrarySection.classList.remove('hidden');
//     }
//     
//     // Show video grid
//     document.getElementById('videoGrid').classList.remove('hidden');
//     document.getElementById('videoPlayer').classList.add('hidden');
//     document.getElementById('sidebarToggle').classList.add('hidden');
//     
//     // Destroy player
//     if (player && player.destroy) {
//         player.destroy();
//         player = null;
//     }
//     
//     // Reset to summary tab on left, transcript on right
//     switchTab('summary');
//     switchTab('transcript');
// });

// Breadcrumb navigation handlers
// Home breadcrumb - go to landing page
const breadcrumbHome = document.getElementById('breadcrumbHome');
if (breadcrumbHome) {
    breadcrumbHome.addEventListener('click', () => {
        // Hide main app
        document.getElementById('mainApp').classList.add('hidden');
        // Show landing page
        document.getElementById('landingPage').classList.remove('hidden');
        
        // Destroy player if exists
        if (player && player.destroy) {
            player.destroy();
            player = null;
        }
    });
}

// Video Library breadcrumb - go to cards section
const breadcrumbLibrary = document.getElementById('breadcrumbLibrary');
if (breadcrumbLibrary) {
    breadcrumbLibrary.addEventListener('click', () => {
        currentVideo = null;
        
        // Show video library section
        const videoLibrarySection = document.getElementById('videoLibrarySection');
        if (videoLibrarySection) {
            videoLibrarySection.classList.remove('hidden');
        }
        
        // Show video grid
        document.getElementById('videoGrid').classList.remove('hidden');
        document.getElementById('videoPlayer').classList.add('hidden');
        document.getElementById('sidebarToggle').classList.add('hidden');
        
        // Destroy player
        if (player && player.destroy) {
            player.destroy();
            player = null;
        }
    });
}

// Tab switching - Independent for left and right sides
function switchTab(tabName) {
    // Define left side tabs and right side tabs
    const leftTabs = ['summary', 'genres'];
    const rightTabs = ['contentalert', 'transcript', 'history'];
    
    const tabContentMap = {
        'transcript': 'transcriptTab',
        'summary': 'summaryTab',
        'genres': 'genresTab',
        'contentalert': 'contentalertTab',
        'features': 'featuresTab',
        'history': 'historyTab',
        'regional': 'regionalTab'
    };
    
    // Determine which side this tab belongs to
    const isLeftTab = leftTabs.includes(tabName);
    const isRightTab = rightTabs.includes(tabName);
    
    if (isLeftTab) {
        // Update only left side tab buttons
        document.querySelectorAll('.tab').forEach(tab => {
            if (leftTabs.includes(tab.dataset.tab)) {
                if (tab.dataset.tab === tabName) {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            }
        });
        
        // Update only left side tab content
        leftTabs.forEach(tab => {
            const contentId = tabContentMap[tab];
            if (contentId) {
                const element = document.getElementById(contentId);
                if (element) {
                    if (tab === tabName) {
                        element.classList.add('active');
                    } else {
                        element.classList.remove('active');
                    }
                }
            }
        });
    }
    
    if (isRightTab) {
        // Update only right side tab buttons
        document.querySelectorAll('.tab').forEach(tab => {
            if (rightTabs.includes(tab.dataset.tab)) {
                if (tab.dataset.tab === tabName) {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            }
        });
        
        // Update only right side tab content
        rightTabs.forEach(tab => {
            const contentId = tabContentMap[tab];
            if (contentId) {
                const element = document.getElementById(contentId);
                if (element) {
                    if (tab === tabName) {
                        element.classList.add('active');
                    } else {
                        element.classList.remove('active');
                    }
                }
            }
        });
    }
}

// Add tab click listeners
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            switchTab(tab.dataset.tab);
        });
    });
    
    // Add region button event listeners (for new regional tab)
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('region-btn')) {
            const region = e.target.dataset.region;
            
            // Remove active class from all buttons
            document.querySelectorAll('.region-btn').forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            e.target.classList.add('active');
            // Load recommendations for selected region
            loadRegionalRecommendationsNew(region);
        }
    });
    
    // Add left side tab switching
    document.querySelectorAll('.left-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            // Update tab buttons
            document.querySelectorAll('.left-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update tab content
            document.querySelectorAll('.left-tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Show corresponding content
            const contentMap = {
                'summary': 'summaryTabLeft',
                'genres': 'genresTabLeft'
            };
            
            const contentId = contentMap[tabName];
            if (contentId) {
                document.getElementById(contentId).classList.add('active');
            }
        });
    });
    
    // Add analysis tab switching (right side)
    document.querySelectorAll('.analysis-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            // Update tab buttons
            document.querySelectorAll('.analysis-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update tab content
            document.querySelectorAll('.analysis-tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Show corresponding content
            const contentMap = {
                'content-alerts': 'contentAlertsTab',
                'transcript': 'transcriptTabContent',
                'regional': 'regionalTabContent',
                'history': 'historyTabContent'
            };
            
            const contentId = contentMap[tabName];
            if (contentId) {
                document.getElementById(contentId).classList.add('active');
            }
        });
    });
    
    // Add category filter functionality using event delegation
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('category-btn') || e.target.closest('.category-btn')) {
            const btn = e.target.classList.contains('category-btn') ? e.target : e.target.closest('.category-btn');
            const category = btn.dataset.category;
            
            // Update active state
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Filter analysis items
            const items = document.querySelectorAll('.analysis-item');
            items.forEach(item => {
                if (category === 'all') {
                    item.style.display = 'block';
                } else {
                    const itemCategory = item.dataset.category;
                    
                    if (itemCategory === category) {
                        item.style.display = 'block';
                    } else {
                        item.style.display = 'none';
                    }
                }
            });
        }
    });
});

// Download subtitles handler
function handleDownloadSubtitles() {
    if (!currentVideo) {
        alert('No video selected');
        return;
    }
    
    // Prepare transcript data in the format expected by subtitle.js
    const segments = currentVideo.video_details.segments || [];
    const transcriptData = segments.map(segment => ({
        timestamp: formatDuration(segment.start),
        text: segment.text
    }));
    
    // Create video object for download function
    const videoForDownload = {
        title: currentVideo.video_details.title,
        transcript: transcriptData
    };
    
    downloadSubtitles(videoForDownload);
}

// Make function globally accessible
window.handleDownloadSubtitles = handleDownloadSubtitles;

// Review modal and functions
let currentReviewAlertIndex = null;
let currentReviewAction = null;
let isSummaryReview = false;

// Current reviewer info (from data.json history logs)
const CURRENT_REVIEWER = {
    name: "Abhishek Shrivastava",
    designation: "Chief Content Reviewer"
};

// Open summary review modal
function openSummaryReviewModal(action) {
    isSummaryReview = true;
    currentReviewAction = action;
    openReviewModal(null, action);
}

// Open review modal
function openReviewModal(alertIndex, action) {
    currentReviewAlertIndex = alertIndex;
    currentReviewAction = action;
    
    // Create modal if it doesn't exist
    let modal = document.getElementById('reviewModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'reviewModal';
        modal.className = 'review-modal';
        modal.innerHTML = `
            <div class="review-modal-content">
                <div class="review-modal-header">
                    <div>
                        <h3 id="reviewModalTitle">Review Content Alert</h3>
                        <div class="reviewer-info">
                            <div class="reviewer-name">${CURRENT_REVIEWER.name}</div>
                            <div class="reviewer-designation">${CURRENT_REVIEWER.designation}</div>
                        </div>
                    </div>
                    <button class="review-modal-close" onclick="closeReviewModal()">&times;</button>
                </div>
                <div class="review-modal-body">
                    <p id="reviewModalMessage"></p>
                    <textarea id="reviewComment" placeholder="Add your comment (optional)..." rows="4"></textarea>
                </div>
                <div class="review-modal-footer">
                    <button class="modal-btn cancel-btn" onclick="closeReviewModal()">Cancel</button>
                    <button class="modal-btn submit-btn" onclick="submitReview()">Submit</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // Update modal content
    const title = isSummaryReview 
        ? (action === 'approved' ? 'Approve Summary' : 'Reject Summary')
        : (action === 'approved' ? 'Approve Content Alert' : 'Reject Content Alert');
    const message = action === 'approved'
        ? 'State the reason for approval'
        : 'State the reason for rejection';
    const placeholder = action === 'approved'
        ? 'Add your reason for approval (optional)...'
        : 'Add your reason for rejection (required)...';
    
    document.getElementById('reviewModalTitle').textContent = title;
    document.getElementById('reviewModalMessage').textContent = message;
    document.getElementById('reviewComment').value = '';
    document.getElementById('reviewComment').placeholder = placeholder;
    
    // Show modal
    modal.style.display = 'flex';
}

// Close review modal
function closeReviewModal() {
    const modal = document.getElementById('reviewModal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentReviewAlertIndex = null;
    currentReviewAction = null;
    isSummaryReview = false;
}

// Submit review
function submitReview() {
    if (!currentReviewAction || !currentVideo) {
        return;
    }
    
    const comment = document.getElementById('reviewComment').value.trim();
    
    // Validate: comment is mandatory for rejection
    if (currentReviewAction === 'rejected' && !comment) {
        showNotification('Please provide a reason for rejection', 'error');
        return;
    }
    
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    let historyEntry;
    let notificationMessage;
    
    if (isSummaryReview) {
        // Handle summary review
        const videoDetails = currentVideo.video_details;
        
        // Update summary with review status
        videoDetails.summary_review_status = currentReviewAction;
        if (comment) {
            videoDetails.summary_review_comment = comment;
        }
        
        // Create history log entry for summary
        historyEntry = {
            timestamp: timestamp,
            action: `Video Summary Review`,
            status: currentReviewAction,
            user: `${CURRENT_REVIEWER.name} (${CURRENT_REVIEWER.designation})`,
            message: comment || `Video summary ${currentReviewAction} without additional comments.`
        };
        
        notificationMessage = `Summary ${currentReviewAction}!`;
    } else {
        // Handle content alert review
        if (currentReviewAlertIndex === null) {
            return;
        }
        
        const contentAnalysis = currentVideo.video_details.category.content_analysis;
        const alert = contentAnalysis[currentReviewAlertIndex];
        
        // Update alert with review status
        alert.review_status = currentReviewAction;
        if (comment) {
            alert.review_comment = comment;
        }
        
        // Create history log entry for content alert
        historyEntry = {
            timestamp: timestamp,
            action: `${alert.alert_type} at ${alert.timestamp}`,
            status: currentReviewAction,
            user: `${CURRENT_REVIEWER.name} (${CURRENT_REVIEWER.designation})`,
            message: comment || `Content alert ${currentReviewAction} without additional comments.`
        };
        
        notificationMessage = `Content alert ${currentReviewAction}!`;
    }
    
    // Add to history logs
    if (!currentVideo.video_details.history_logs) {
        currentVideo.video_details.history_logs = [];
    }
    currentVideo.video_details.history_logs.unshift(historyEntry);
    
    // Capture action before closing modal
    const reviewAction = currentReviewAction;
    
    // Close modal
    closeReviewModal();
    
    // Refresh displays
    if (isSummaryReview) {
        populateLeftSideTabs();
    } else {
        populateAnalysisResults();
    }
    populateHistoryTab();
    
    // Show success message
    showNotification(notificationMessage, reviewAction);
}

// Show notification
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'approved' ? '#10b981' : '#ef4444'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Get rating badge class
function getRatingClass(rating) {
    if (!rating) return 'badge-green';
    
    // Extract the rating letter from formats like "A (Adults Only)" or "U/A"
    const ratingUpper = rating.toUpperCase();
    
    if (ratingUpper.includes('U/A') || ratingUpper.startsWith('UA')) {
        return 'badge-yellow';
    } else if (ratingUpper.startsWith('A')) {
        return 'badge-red';
    } else if (ratingUpper.startsWith('U')) {
        return 'badge-green';
    }
    
    return 'badge-green';
}

// Rating override and approval functions
function openRatingOverrideModal() {
    if (!currentVideo) return;
    
    // Get currently selected country
    const activeCountryBtn = document.querySelector('.summary-country-btn.active');
    const selectedCountry = activeCountryBtn ? activeCountryBtn.dataset.country : 'india';
    
    // Define country-specific rating options
    const ratingOptionsByCountry = {
        india: [
            { value: 'U', label: 'U - Universal (All Ages)' },
            { value: 'U/A 7+', label: 'U/A 7+ - Parental Guidance (7+)' },
            { value: 'U/A 13+', label: 'U/A 13+ - Parental Guidance (13+)' },
            { value: 'U/A 16+', label: 'U/A 16+ - Parental Guidance (16+)' },
            { value: 'A', label: 'A - Adults Only (18+)' }
        ],
        united_states: [
            { value: 'TV-Y', label: 'TV-Y - All Children' },
            { value: 'TV-Y7', label: 'TV-Y7 - Older Children (7+)' },
            { value: 'TV-G', label: 'TV-G - General Audience' },
            { value: 'TV-PG', label: 'TV-PG - Parental Guidance' },
            { value: 'TV-14', label: 'TV-14 - Parents Cautioned (14+)' },
            { value: 'TV-MA', label: 'TV-MA - Mature Audiences (17+)' }
        ],
        france: [
            { value: 'Tous publics', label: 'Tous publics - All Audiences' },
            { value: '-10', label: '-10 - Not for Under 10' },
            { value: '-12', label: '-12 - Not for Under 12' },
            { value: '-16', label: '-16 - Not for Under 16' },
            { value: '-18', label: '-18 - Prohibited for Minors' }
        ],
        japan: [
            { value: 'G', label: 'G - General Audiences' },
            { value: 'PG12', label: 'PG12 - Parental Guidance (12+)' },
            { value: 'R15+', label: 'R15+ - Restricted (15+)' },
            { value: 'R18+', label: 'R18+ - Adults Only (18+)' }
        ]
    };
    
    // Get rating options for selected country
    const ratingOptions = ratingOptionsByCountry[selectedCountry] || ratingOptionsByCountry.india;
    
    // Get country name for display
    const countryNames = {
        india: 'India',
        united_states: 'United States',
        france: 'France',
        japan: 'Japan'
    };
    const countryName = countryNames[selectedCountry] || 'India';
    
    // Create override modal
    let modal = document.getElementById('ratingOverrideModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'ratingOverrideModal';
        modal.className = 'review-modal';
        document.body.appendChild(modal);
    }
    
    // Build modal content
    modal.className = 'review-modal';
    modal.innerHTML = `
        <div class="review-modal-content">
            <div class="review-modal-header">
                <div>
                    <h3>Override Rating - ${countryName}</h3>
                    <div class="reviewer-info">
                        <div class="reviewer-name">${CURRENT_REVIEWER.name}</div>
                        <div class="reviewer-designation">${CURRENT_REVIEWER.designation}</div>
                    </div>
                </div>
                <button class="review-modal-close" onclick="closeRatingOverrideModal()">&times;</button>
            </div>
            <div class="review-modal-body">
                <p style="margin-bottom: 16px;">Select the ${countryName} rating to override the AI suggestion:</p>
                
                <!-- Rating Dropdown -->
                <select id="ratingSelect" class="rating-select">
                    <option value="">Select rating...</option>
                    ${ratingOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
                </select>
                
                <textarea id="ratingOverrideComment" placeholder="Add reason for override (optional)..." rows="3" style="margin-top: 12px;"></textarea>
            </div>
            <div class="review-modal-footer">
                <button class="modal-btn cancel-btn" onclick="closeRatingOverrideModal()">Cancel</button>
                <button class="modal-btn submit-btn" onclick="submitRatingOverride()">Override</button>
            </div>
        </div>
    `;
    
    // Show modal
    modal.style.display = 'flex';
}

function closeRatingOverrideModal() {
    const modal = document.getElementById('ratingOverrideModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function submitRatingOverride() {
    if (!currentVideo) return;
    
    // Get the selected rating from the dropdown
    const newRating = document.getElementById('ratingSelect').value;
    const comment = document.getElementById('ratingOverrideComment').value.trim();
    
    if (!newRating) {
        alert('Please select a rating');
        return;
    }
    
    // Get currently selected country
    const activeCountryBtn = document.querySelector('.summary-country-btn.active');
    const selectedCountry = activeCountryBtn ? activeCountryBtn.dataset.country : 'india';
    
    // Update region-specific human rating
    const regionalRecs = currentVideo.video_details.regional_recommendations || {};
    if (!regionalRecs[selectedCountry]) {
        regionalRecs[selectedCountry] = {};
    }
    regionalRecs[selectedCountry].human_rating = newRating;
    
    // Create history log entry
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const countryNames = {
        india: 'India',
        united_states: 'United States',
        france: 'France',
        japan: 'Japan'
    };
    const countryName = countryNames[selectedCountry] || selectedCountry;
    
    const historyEntry = {
        timestamp: timestamp,
        action: `Rating Override (${countryName}): ${newRating}`,
        status: 'approved',
        user: `${CURRENT_REVIEWER.name} (${CURRENT_REVIEWER.designation})`,
        message: comment || `${countryName} rating overridden to ${newRating}`
    };
    
    // Add to history logs
    if (!currentVideo.video_details.history_logs) {
        currentVideo.video_details.history_logs = [];
    }
    currentVideo.video_details.history_logs.unshift(historyEntry);
    
    // Close modal
    closeRatingOverrideModal();
    
    // Refresh displays
    populateLeftSideTabs();
    populateHistoryTab();
    
    // Show notification
    showNotification(`Rating overridden to ${newRating}!`, 'approved');
}

function approveCurrentRating() {
    if (!currentVideo) return;
    
    // Mark rating as approved
    currentVideo.video_details.rating_approved = true;
    
    // Create history log entry
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const currentRating = currentVideo.video_details.category.human_rating || currentVideo.video_details.category.rating;
    const historyEntry = {
        timestamp: timestamp,
        action: `Rating Approval: ${currentRating}`,
        status: 'approved',
        user: `${CURRENT_REVIEWER.name} (${CURRENT_REVIEWER.designation})`,
        message: `Rating Approved`
    };
    
    // Add to history logs
    if (!currentVideo.video_details.history_logs) {
        currentVideo.video_details.history_logs = [];
    }
    currentVideo.video_details.history_logs.unshift(historyEntry);
    
    // Refresh displays
    populateLeftSideTabs();
    populateHistoryTab();
    
    // Show notification
    showNotification('Rating approved!', 'approved');
}

// Toggle expand details in video library
function toggleExpandDetails(event, videoIndex) {
    event.stopPropagation(); // Prevent card click
    
    const expandedSection = document.getElementById(`expanded-details-${videoIndex}`);
    const arrowBtn = event.currentTarget;
    const arrowIcon = arrowBtn.querySelector('.arrow-icon');
    
    // Close all other expanded sections
    document.querySelectorAll('.video-card-expanded').forEach((section, idx) => {
        if (idx !== videoIndex) {
            section.classList.remove('show');
        }
    });
    
    // Reset all other arrows
    document.querySelectorAll('.expand-arrow-btn .arrow-icon').forEach((icon, idx) => {
        if (idx !== videoIndex) {
            icon.style.transform = 'rotate(0deg)';
        }
    });
    
    // Toggle current section
    const isExpanded = expandedSection.classList.toggle('show');
    
    // Rotate arrow
    arrowIcon.style.transform = isExpanded ? 'rotate(90deg)' : 'rotate(0deg)';
}

// Make functions globally accessible for onclick handlers
window.toggleExpandDetails = toggleExpandDetails;
window.seekTo = seekTo;
window.openReviewModal = openReviewModal;
window.closeReviewModal = closeReviewModal;
window.submitReview = submitReview;
window.openSummaryReviewModal = openSummaryReviewModal;
window.openRatingOverrideModal = openRatingOverrideModal;
window.closeRatingOverrideModal = closeRatingOverrideModal;
window.submitRatingOverride = submitRatingOverride;
window.approveCurrentRating = approveCurrentRating;
window.showLandingPage = showLandingPage;
window.showGuidelinesPage = showGuidelinesPage;
window.showContactPage = showContactPage;

// Page navigation functions
function showLandingPage() {
    document.getElementById('landingPage').classList.remove('hidden');
    document.getElementById('guidelinesPage').classList.add('hidden');
    document.getElementById('contactPage').classList.add('hidden');
    document.getElementById('mainApp').classList.add('hidden');
}

function showGuidelinesPage() {
    document.getElementById('landingPage').classList.add('hidden');
    document.getElementById('guidelinesPage').classList.remove('hidden');
    document.getElementById('contactPage').classList.add('hidden');
    document.getElementById('mainApp').classList.add('hidden');
}

function showContactPage() {
    document.getElementById('landingPage').classList.add('hidden');
    document.getElementById('guidelinesPage').classList.add('hidden');
    document.getElementById('contactPage').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
}

// Switch guidelines tabs
function switchGuidelinesTab(country) {
    // Update tab buttons
    document.querySelectorAll('.guidelines-tab').forEach(tab => {
        if (tab.dataset.country === country) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Update content
    document.querySelectorAll('.guidelines-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`guidelines-${country}`).classList.add('active');
}

// Sidebar toggle button listener - wrapped in DOMContentLoaded to ensure element exists
document.addEventListener('DOMContentLoaded', () => {
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }
});

// Note: Data loading is now triggered by the "Start Review" button on the landing page
