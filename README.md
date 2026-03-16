# MovieBuff 🎬

**Your AI-Assisted Cinema Companion**  
Analyze, transcribe, and deep-dive into iconic movie moments with comprehensive content analysis and regional recommendations.

## Overview

MovieBuff is a modern web application for AI-powered video content analysis, featuring real-time transcript highlighting, automated processing workflows, audit trails, and geography-specific content recommendations.

## Features

### 🎥 **Video Analysis**
- **Interactive Transcripts**: Real-time highlighting synchronized with video playback
- **Clickable Timestamps**: Jump to any moment in the video instantly
- **AI-Powered Summaries**: Detailed video summaries with sentiment analysis
- **Genre Classification**: Multi-genre detection with confidence scores

### 📊 **Content Management**
- **Automated Processing**: 5-step workflow with visual progress tracking
  1. Audio Extraction
  2. Transcript Generation
  3. Video Analysis
  4. Sentiment Analysis
  5. Summary Generation
- **Content Rating**: Age-appropriate ratings with detailed content alerts
- **Smart Features**: Mood tags, key moments, and engagement scores

### 📝 **Audit & Compliance**
- **History Logs**: Complete audit trail of content review actions
  - Approval/rejection tracking
  - Reviewer information with designations
  - Timestamped actions with detailed messages
- **Regional Recommendations**: Geography-specific content advisory
  - India, France, Japan, United States
  - Localized rating suggestions
  - Broadcast compliance requirements
  - Cultural sensitivity guidelines

### 🎨 **User Interface**
- **Tab-Based Navigation**: 7 organized tabs in 4+3 grid layout
  - Transcript, Summary, Genres, Category
  - Smart Features, History Logs, Regional Recommendations
- **50/50 Split Layout**: Video player and content side-by-side
- **Responsive Design**: Optimized for desktop and mobile
- **Clean Aesthetic**: Soft color palette (#AEB784, #E3DBBB, #F8F3E1)

## Tech Stack

- **Frontend**: HTML5, CSS3 (Tailwind), Vanilla JavaScript
- **Video**: YouTube IFrame API
- **Transcription**: OpenAI Whisper
- **Font**: Poppins (Google Fonts)

## Quick Start

1. Start a local server:
```bash
python3 -m http.server 8000
```

2. Open `http://localhost:8000` in your browser

## Usage

### **Video Selection & Processing**
1. Browse videos in the main grid or use the sidebar navigation
2. Click on any video to start automatic processing
3. Watch the 5-step progress bar as content is analyzed
4. Processing completes automatically in ~7 seconds

### **Exploring Content**
1. **Transcript Tab**: View synchronized transcript with real-time highlighting
   - Click any timestamp to jump to that moment
   - Active line highlights as video plays
2. **Summary Tab**: Read AI-generated detailed summary
   - View sentiment analysis
   - Check video length and metadata
3. **Genres Tab**: Explore genre classifications
   - See confidence scores with visual bars
   - Read AI reasoning for each genre
4. **Category Tab**: Review content ratings and alerts
   - Age-appropriate rating badges
   - Timestamped content warnings
5. **Smart Features Tab**: Discover key moments and mood tags
   - Clickable highlights with timestamps
   - Engagement scores and accessibility info
6. **History Logs Tab**: Track content review history
   - Approval/rejection status
   - Reviewer names and timestamps
   - Detailed action messages
7. **Regional Recommendations Tab**: Get geography-specific guidance
   - Select region (India, France, Japan, USA)
   - View localized ratings and requirements
   - See broadcast compliance recommendations

## Project Structure

```
moviebuff/
├── index.html    # UI and styling
├── app.js        # Application logic
├── data.json     # Video data and analysis
└── README.md     # Documentation
```

## Data Format

Each video in `data.json` includes:

### **video_details**
- `metadata`: Title, URL, duration, views, likes, resolution
- `segments`: Transcript with start/end times and text
- `detailed_summary`: AI-generated comprehensive summary

### **genres**
- Genre name with confidence score (0-1)
- AI reasoning for classification

### **category**
- `rating`: Age-appropriate rating (U, U/A, A, etc.)
- `content_analysis`: Timestamped content alerts with descriptions

### **smart_features**
- `key_moments`: Clickable highlights with timestamps
- `mood_tags`: Emotional tone descriptors
- `engagement_score`: Viewer engagement rating
- `sentiment_analysis`: Overall sentiment classification
- `accessibility`: Caption availability and motion intensity

### **history_logs**
- `timestamp`: Action date and time
- `action`: Description of review action
- `status`: approved/rejected
- `user`: Reviewer name with designation
- `message`: Optional detailed feedback

### **regional_recommendations**
- Region-specific keys: `india`, `france`, `japan`, `united_states`
- `rating_suggestion`: Localized age rating
- `changes_required`: Boolean flag
- `recommendations`: Array of specific guidance

## Customization

**Colors**: Edit CSS variables in `index.html`
- Primary: `#AEB784`
- Secondary: `#E3DBBB`
- Background: `#F8F3E1`

**Font**: Change Google Fonts import in `<head>`

## Browser Support

Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## License

Open source for educational purposes.
