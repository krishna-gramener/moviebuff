// Global variables
let videosData = [];
let currentVideo = null;
let player = null;
let currentState = 'landing'; // landing, selection, transcription, analysis
let currentTab = 'transcript';

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
    currentState = 'selection';
    
    // Hide grid, show player
    document.getElementById('videoGrid').classList.add('hidden');
    document.getElementById('videoPlayer').classList.remove('hidden');
    
    // Show sidebar toggle
    document.getElementById('sidebarToggle').classList.remove('hidden');
    
    // Reset button and sections
    document.getElementById('primaryBtn').textContent = 'Generate Transcription';
    document.getElementById('primaryBtn').style.display = 'inline-block';
    document.getElementById('tabContainer').classList.add('hidden');
    document.getElementById('videoWithTranscript').classList.add('hidden');
    document.getElementById('videoPlayerContainer').classList.remove('hidden');
    
    // Player stays in transcript wrapper - just hide/show containers
    
    // Remove active class from all tab contents
    document.getElementById('analysisTab').classList.remove('active');
    
    // Update sidebar active state
    updateSidebarActiveState();
    
    // Load YouTube player
    const videoUrl = currentVideo.video_details.url || currentVideo.video_details.metadata.video_url;
    const videoId = extractVideoId(videoUrl);
    
    // Always recreate player in center layout when selecting new video
    if (player && player.destroy) {
        player.destroy();
    }
    
    // Remove old player div if it exists
    const oldPlayerDiv = document.getElementById('player');
    if (oldPlayerDiv) {
        oldPlayerDiv.remove();
    }
    
    // Create new player in center layout
    createPlayer(videoId, false);
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
function createPlayer(videoId, inTranscriptLayout = false) {
    // Determine which wrapper to use
    const wrapperToUse = inTranscriptLayout ? 'playerWrapperTranscript' : 'playerWrapper';
    
    let playerDiv = document.getElementById('player');
    if (!playerDiv) {
        playerDiv = document.createElement('div');
        playerDiv.id = 'player';
        playerDiv.className = 'w-full aspect-video rounded-2xl overflow-hidden shadow-2xl';
        playerDiv.style.border = '4px solid rgba(174, 183, 132, 0.5)';
        const wrapper = document.getElementById(wrapperToUse);
        if (wrapper) {
            wrapper.appendChild(playerDiv);
        }
    }
    
    console.log('Creating YouTube player for video:', videoId, 'in', wrapperToUse);
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
    currentState = 'landing';
    
    document.getElementById('videoGrid').classList.remove('hidden');
    document.getElementById('videoPlayer').classList.add('hidden');
    document.getElementById('sidebarToggle').classList.add('hidden');
    
    if (player) {
        player.pauseVideo();
    }
});

// Primary button handler
document.getElementById('primaryBtn').addEventListener('click', () => {
    if (currentState === 'selection') {
        // Generate transcription with progress
        document.getElementById('primaryBtn').style.display = 'none';
        showTranscriptionProgress();
    } else if (currentState === 'transcription') {
        // Show analysis with progress
        document.getElementById('primaryBtn').style.display = 'none';
        showAnalysisProgress();
    }
});

// Show transcription progress
function showTranscriptionProgress() {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const progressPercent = document.getElementById('progressPercent');
    const progressFill = document.getElementById('progressFill');
    
    progressBar.classList.remove('hidden');
    
    // Step 1: Extracting audio
    progressText.textContent = 'Extracting audio...';
    progressPercent.textContent = '33%';
    progressFill.style.width = '33%';
    
    setTimeout(() => {
        // Step 2: Generating transcript
        progressText.textContent = 'Generating transcript...';
        progressPercent.textContent = '66%';
        progressFill.style.width = '66%';
        
        setTimeout(() => {
            // Step 3: Complete
            progressText.textContent = 'Transcript ready!';
            progressPercent.textContent = '100%';
            progressFill.style.width = '100%';
            
            setTimeout(() => {
                // Hide progress bar and show results
                progressBar.classList.add('hidden');
                progressFill.style.width = '0%';
                
                generateTranscription();
                currentState = 'transcription';
                document.getElementById('primaryBtn').textContent = 'Analyze Video';
                document.getElementById('primaryBtn').style.display = 'inline-block';
                
                // Recreate player in transcript layout
                const videoId = extractVideoId(currentVideo.video_details.url || currentVideo.video_details.metadata.video_url);
                
                // Destroy old player
                if (player && player.destroy) {
                    player.destroy();
                }
                
                // Remove old player div
                const oldPlayerDiv = document.getElementById('player');
                if (oldPlayerDiv) {
                    oldPlayerDiv.remove();
                }
                
                // Switch to 2-column layout
                document.getElementById('videoPlayerContainer').classList.add('hidden');
                document.getElementById('videoWithTranscript').classList.remove('hidden');
                
                // Create new player in transcript layout
                createPlayer(videoId, true);
                
                console.log('Layout switched to transcript view with new player');
            }, 800);
        }, 2000);
    }, 1800);
}

// Show analysis progress
function showAnalysisProgress() {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const progressPercent = document.getElementById('progressPercent');
    const progressFill = document.getElementById('progressFill');
    
    progressBar.classList.remove('hidden');
    
    // Step 1: Analyzing video
    progressText.textContent = 'Analyzing video...';
    progressPercent.textContent = '50%';
    progressFill.style.width = '50%';
    
    setTimeout(() => {
        // Step 2: Almost there
        progressText.textContent = 'Almost there...';
        progressPercent.textContent = '80%';
        progressFill.style.width = '80%';
        
        setTimeout(() => {
            // Step 3: Analysis done
            progressText.textContent = 'Analysis done!';
            progressPercent.textContent = '100%';
            progressFill.style.width = '100%';
            
            setTimeout(() => {
                // Hide progress bar and show results
                progressBar.classList.add('hidden');
                progressFill.style.width = '0%';
                
                generateAnalysis();
                currentState = 'analysis';
                
                // Show tab container and analysis
                document.getElementById('tabContainer').classList.remove('hidden');
                document.getElementById('analysisTab').classList.add('active');
            }, 800);
        }, 2200);
    }, 2000);
}

// Show loading animation
function showLoadingAnimation() {
    const btn = document.getElementById('primaryBtn');
    const originalText = btn.textContent;
    btn.innerHTML = '<div class="loading-spinner"></div>';
    btn.disabled = true;
    
    setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
    }, 800);
}

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
    
    if (tabName === 'transcript') {
        document.getElementById('transcriptTab').classList.add('active');
    } else if (tabName === 'analysis') {
        document.getElementById('analysisTab').classList.add('active');
    }
}

// Add tab click listeners
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            switchTab(tab.dataset.tab);
        });
    });
});

// Generate transcription
function generateTranscription() {
    const container = document.getElementById('transcriptContainer');
    container.innerHTML = '';
    
    const segments = currentVideo.video_details.segments || [];
    const contentAnalysis = currentVideo.video_details.category.content_analysis || [];
    
    // If no segments available, show a message
    if (segments.length === 0) {
        container.innerHTML = '<p style="color: #718096; text-align: center; padding: 40px;">Transcript not available for this video.</p>';
        return;
    }
    
    segments.forEach((segment, index) => {
        const line = document.createElement('div');
        line.className = 'transcript-line';
        line.dataset.startTime = segment.start;
        line.dataset.endTime = segment.end;
        line.dataset.index = index;
        
        // Check if this segment has any content alerts
        const alerts = contentAnalysis.filter(alert => {
            const alertTime = parseFloat(alert.timestamp);
            return alertTime >= segment.start && alertTime < segment.end;
        });
        
        // Create timestamp link
        const timestamp = document.createElement('a');
        timestamp.className = 'timestamp-link';
        timestamp.textContent = formatTimestamp(segment.start);
        timestamp.onclick = (e) => {
            e.preventDefault();
            seekTo(segment.start);
        };
        
        // Create text content
        const text = document.createElement('span');
        text.className = 'ml-4';
        text.textContent = segment.text;
        
        line.appendChild(timestamp);
        line.appendChild(text);
        container.appendChild(line);
    });
}

// Generate analysis
function generateAnalysis() {
    const videoDetails = currentVideo.video_details;
    
    // Detailed Summary (Top) with video length
    const summaryContent = document.getElementById('summaryContent');
    summaryContent.textContent = videoDetails.detailed_summary;
    
    const videoLength = document.getElementById('videoLength');
    videoLength.innerHTML = `Duration: <span style="color: #2d3748; font-weight: 600;">${formatDuration(videoDetails.metadata.duration)}</span>`;
    
    // Sentiment Analysis Badge
    const sentimentBadge = document.getElementById('sentimentBadge');
    const sentiment = videoDetails.smart_features?.sentiment_analysis || '';
    if (sentiment) {
        sentimentBadge.textContent = sentiment;
        sentimentBadge.style.display = 'inline-block';
    } else {
        sentimentBadge.style.display = 'none';
    }
    
    // Genres with confidence bars
    const genres = videoDetails.genres;
    const genresContent = document.getElementById('genresContent');
    genresContent.innerHTML = genres.map(genre => `
        <div class="mb-6">
            <div class="flex justify-between items-center mb-2">
                <span class="font-bold text-lg" style="color: #2d3748;">${genre.genre}</span>
                <span class="font-semibold" style="color: #4a5568;">${(genre.confidence_score * 100).toFixed(0)}%</span>
            </div>
            <div class="confidence-bar">
                <div class="confidence-fill" style="width: ${genre.confidence_score * 100}%"></div>
            </div>
            <p class="text-sm mt-2" style="color: #718096;">${genre.reasoning}</p>
        </div>
    `).join('');
    
    // Category & Rating
    const category = videoDetails.category;
    const rating = category.rating || category.age_rating || 'Not Rated';
    const ratingClass = getRatingClass(rating);
    const categoryContent = document.getElementById('categoryContent');
    
    let contentAnalysisHTML = '';
    if (category.content_analysis && category.content_analysis.length > 0) {
        contentAnalysisHTML = `
            <div class="mt-6">
                <h4 class="font-semibold mb-3 text-lg" style="color: #2d3748;">Content Alerts:</h4>
                <div class="space-y-3">
                    ${category.content_analysis.map(alert => {
                        const seconds = convertTimeToSeconds(alert.timestamp);
                        return `
                            <div class="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
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
    
    // Smart Features
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
                            <div class="p-4 bg-white/10 rounded-xl backdrop-blur-sm hover:bg-white/20 transition">
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

// Sidebar toggle button listener
document.getElementById('sidebarToggle').addEventListener('click', toggleSidebar);

// Initialize app
loadData();
