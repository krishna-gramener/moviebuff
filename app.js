// Global variables
let videosData = [];
let currentVideo = null;
let player = null;
let currentTab = 'transcript';
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
        const response = await fetch('data.json');
        videosData = await response.json();
        renderVideoGrid();
        renderSidebar();
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Failed to load video data. Please ensure data.json exists.');
    }
}

// Render video grid
function renderVideoGrid() {
    const grid = document.getElementById('videoGrid');
    grid.innerHTML = '';
    
    videosData.forEach((video, index) => {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.onclick = () => selectVideo(video);
        
        // Extract video ID from YouTube URL
        const videoUrl = video.video_details.url || video.video_details.metadata.video_url;
        const videoTitle = video.video_details.title || video.video_details.metadata.title;
        const videoDuration = video.video_details.metadata.duration;
        
        const videoId = extractVideoId(videoUrl);
        const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        
        card.innerHTML = `
            <img src="${thumbnailUrl}" alt="${videoTitle}" class="w-full h-48 object-cover">
            <div class="p-4">
                <h3 class="text-xl font-semibold mb-2" style="color: #2d3748;">${videoTitle}</h3>
                <p class="text-sm" style="color: #718096;">${formatDuration(videoDuration)}</p>
            </div>
        `;
        
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
    currentTab = 'transcript';
    currentStepIndex = 0;
    
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
    
    // Update video title
    document.querySelector('#videoTitle h1').textContent = videoTitle;
    
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
}

// Load transcript into the transcript tab
function loadTranscript() {
    const transcriptContainer = document.getElementById('transcriptContainer');
    const segments = currentVideo.video_details.segments;
    
    if (!segments || segments.length === 0) {
        transcriptContainer.innerHTML = '<p style="color: #718096;">No transcript available for this video.</p>';
        return;
    }
    
    transcriptContainer.innerHTML = '';
    segments.forEach((segment, index) => {
        const transcriptItem = document.createElement('div');
        transcriptItem.className = 'transcript-line p-3 rounded-lg hover:bg-gray-50 transition cursor-pointer';
        transcriptItem.dataset.startTime = segment.start;
        transcriptItem.dataset.endTime = segment.end;
        transcriptItem.dataset.index = index;
        transcriptItem.innerHTML = `
            <a href="#" class="timestamp-link" onclick="seekTo(${segment.start}); return false;">
                ${formatTimestamp(segment.start)}
            </a>
            <span class="ml-3" style="color: #2d3748;">${segment.text}</span>
        `;
        transcriptContainer.appendChild(transcriptItem);
    });
}

// Load analysis data into respective tabs
function loadAnalysisData() {
    const videoDetails = currentVideo.video_details;
    
    // Summary Tab
    const summaryContent = document.getElementById('summaryContent');
    const sentimentBadge = document.getElementById('sentimentBadge');
    const videoLength = document.getElementById('videoLength');
    
    summaryContent.textContent = videoDetails.detailed_summary || videoDetails.summary || 'No summary available.';
    
    // Sentiment from smart_features
    const sentiment = videoDetails.smart_features?.sentiment_analysis || videoDetails.sentiment || '';
    if (sentiment) {
        sentimentBadge.textContent = sentiment;
        sentimentBadge.className = `badge badge-blue text-sm px-4 py-2`;
    } else {
        sentimentBadge.style.display = 'none';
    }
    
    videoLength.textContent = `Video Length: ${formatDuration(videoDetails.metadata.duration)}`;
    
    // Genres Tab
    const genresContent = document.getElementById('genresContent');
    const genres = videoDetails.genres;
    
    genresContent.innerHTML = genres.map(genre => `
        <div class="mb-6">
            <div class="flex justify-between items-center mb-2">
                <span class="font-semibold text-lg" style="color: #2d3748;">${genre.genre}</span>
                <span class="text-sm font-medium" style="color: #AEB784;">${Math.round((genre.confidence_score || genre.confidence) * 100)}%</span>
            </div>
            <div class="confidence-bar">
                <div class="confidence-fill" style="width: ${(genre.confidence_score || genre.confidence) * 100}%"></div>
            </div>
            ${genre.reasoning ? `<p class="text-sm mt-2" style="color: #718096;">${genre.reasoning}</p>` : ''}
        </div>
    `).join('');
    
    // Category Tab
    const categoryContent = document.getElementById('categoryContent');
    const category = videoDetails.category;
    const rating = category.rating || category.age_rating || 'Not Rated';
    const ratingClass = getRatingClass(rating);
    
    let contentAnalysisHTML = '';
    if (category.content_analysis && category.content_analysis.length > 0) {
        contentAnalysisHTML = `
            <div class="mt-6">
                <h4 class="font-semibold mb-3 text-lg" style="color: #2d3748;">Content Alerts:</h4>
                <div class="space-y-3">
                    ${category.content_analysis.map(alert => {
                        const seconds = convertTimeToSeconds(alert.timestamp);
                        return `
                            <div class="p-4 bg-gray-50 rounded-xl">
                                <span class="badge badge-amber">${alert.alert_type}</span>
                                <a href="#" class="ml-2 font-semibold timestamp-link" onclick="seekTo(${seconds}); return false;">
                                    ${formatTimestamp(alert.timestamp)}
                                </a>
                                <p class="text-sm mt-2" style="color: #4a5568;">${alert.description}</p>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    categoryContent.innerHTML = `
        <div>
            <p class="text-sm mb-3" style="color: #718096;">Age Rating</p>
            <span class="badge ${ratingClass} text-xl px-6 py-3">${rating}</span>
            ${contentAnalysisHTML}
        </div>
    `;
    
    // Smart Features Tab
    const smartFeatures = videoDetails.smart_features;
    const smartFeaturesContent = document.getElementById('smartFeaturesContent');
    
    let moodTagsHTML = '';
    if (smartFeatures.mood_tags && smartFeatures.mood_tags.length > 0) {
        moodTagsHTML = `
            <div class="mb-6">
                <h4 class="font-semibold mb-3 text-lg" style="color: #2d3748;">Mood Tags:</h4>
                <div class="flex flex-wrap gap-3">
                    ${smartFeatures.mood_tags.map(tag => `
                        <span class="badge badge-green text-base px-4 py-2">${tag}</span>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    let keyMomentsHTML = '';
    if (smartFeatures.key_moments && smartFeatures.key_moments.length > 0) {
        keyMomentsHTML = `
            <div>
                <h4 class="font-semibold mb-3 text-lg" style="color: #2d3748;">Highlights:</h4>
                <div class="space-y-3">
                    ${smartFeatures.key_moments.map(moment => {
                        const time = moment.time || moment.timestamp;
                        const desc = moment.label || moment.description;
                        const seconds = convertTimeToSeconds(time);
                        return `
                            <div class="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                                <a href="#" class="timestamp-link text-lg" onclick="seekTo(${seconds}); return false;">
                                    ${formatTimestamp(time)}
                                </a>
                                <span class="ml-3" style="color: #2d3748;">${desc}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    smartFeaturesContent.innerHTML = moodTagsHTML + keyMomentsHTML;
    
    // History Logs Tab
    const historyLogsContent = document.getElementById('historyLogsContent');
    const historyLogs = videoDetails.history_logs || [];
    
    if (historyLogs.length === 0) {
        historyLogsContent.innerHTML = '<p style="color: #718096;">No history logs available.</p>';
    } else {
        historyLogsContent.innerHTML = historyLogs.map(log => {
            const statusClass = log.status;
            const messageHTML = log.message ? `<div class="log-message">${log.message}</div>` : '';
            
            return `
                <div class="history-log-item ${statusClass}">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <h4 class="font-semibold text-base" style="color: #2d3748;">${log.action}</h4>
                            <p class="text-xs mt-1" style="color: #718096;">
                                <span>${log.timestamp}</span>
                                <span class="mx-2">•</span>
                                <span>${log.user}</span>
                            </p>
                        </div>
                        <span class="log-status-badge ${statusClass}">${statusClass}</span>
                    </div>
                    ${messageHTML}
                </div>
            `;
        }).join('');
    }
    
    // Regional Recommendations Tab
    loadRegionalRecommendations('india'); // Default to India
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
        console.log('Player not ready');
        return;
    }
    
    const currentTime = player.getCurrentTime();
    const transcriptLines = document.querySelectorAll('.transcript-line');
    
    console.log('Update transcript - Time:', currentTime, 'Lines:', transcriptLines.length);
    
    if (transcriptLines.length === 0) {
        console.log('No transcript lines found');
        return;
    }
    
    let foundActive = false;
    transcriptLines.forEach(line => {
        const startTime = parseFloat(line.dataset.startTime);
        const endTime = parseFloat(line.dataset.endTime);
        
        if (currentTime >= startTime && currentTime < endTime) {
            if (!line.classList.contains('active')) {
                console.log('Activating line:', startTime, '-', endTime, line.textContent.substring(0, 50));
                foundActive = true;
            }
            line.classList.add('active');
            // Auto-scroll within the transcript container
            const container = document.getElementById('transcriptContainer');
            if (container) {
                const lineTop = line.offsetTop;
                const lineHeight = line.offsetHeight;
                const containerScroll = container.scrollTop;
                const containerHeight = container.clientHeight;
                
                // Scroll if line is not visible
                if (lineTop < containerScroll || lineTop + lineHeight > containerScroll + containerHeight) {
                    line.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        } else {
            line.classList.remove('active');
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
document.getElementById('backBtn').addEventListener('click', () => {
    currentVideo = null;
    
    // Show video grid
    document.getElementById('videoGrid').classList.remove('hidden');
    document.getElementById('videoPlayer').classList.add('hidden');
    document.getElementById('sidebarToggle').classList.add('hidden');
    
    // Destroy player
    if (player && player.destroy) {
        player.destroy();
        player = null;
    }
    
    // Reset to transcript tab
    switchTab('transcript');
});

// Tab switching
function switchTab(tabName) {
    currentTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        if (tab.dataset.tab === tabName) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Show the selected tab content
    const tabContentMap = {
        'transcript': 'transcriptTab',
        'summary': 'summaryTab',
        'genres': 'genresTab',
        'category': 'categoryTab',
        'features': 'featuresTab',
        'history': 'historyTab',
        'regional': 'regionalTab'
    };
    
    const contentId = tabContentMap[tabName];
    if (contentId) {
        document.getElementById(contentId).classList.add('active');
    }
}

// Add tab click listeners
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            switchTab(tab.dataset.tab);
        });
    });
    
    // Add region button event listeners
    document.querySelectorAll('.region-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            document.querySelectorAll('.region-btn').forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            // Load recommendations for selected region
            loadRegionalRecommendations(btn.dataset.region);
        });
    });
});

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

// Sidebar toggle button listener
document.getElementById('sidebarToggle').addEventListener('click', toggleSidebar);

// Initialize app
loadData();
