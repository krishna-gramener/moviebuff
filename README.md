# MovieBuff 🎬

**Your AI-Assisted Cinema Companion**  
Analyze, transcribe, and deep-dive into iconic movie moments.

## Overview

MovieBuff is a minimalistic web application for AI-powered video analysis with real-time transcript highlighting.

## Features

- **Interactive Transcripts**: Real-time highlighting synchronized with video playback
- **AI Analysis**: Genre detection, content rating, and detailed summaries
- **Smart Highlights**: Timestamped key moments with clickable navigation
- **Clean UI**: Minimalistic design with soft color palette (#AEB784, #E3DBBB, #F8F3E1)

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

1. Select a video from the grid
2. Click "Generate Transcription" to view transcript
3. Click "Analyze Video" for detailed analysis
4. Play video to see real-time transcript highlighting
5. Click timestamps to jump to specific moments

## Project Structure

```
moviebuff/
├── index.html    # UI and styling
├── app.js        # Application logic
├── data.json     # Video data and analysis
└── README.md     # Documentation
```

## Data Format

Videos in `data.json` include:
- Metadata (title, URL, duration, views)
- Transcription segments with timestamps
- Genre classifications with confidence scores
- Content ratings and alerts
- Smart features (mood tags, highlights, sentiment)

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
