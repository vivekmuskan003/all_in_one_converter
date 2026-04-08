# FileForge — All-in-One File Converter & Compressor

A full-stack web application for converting and compressing audio, video, documents, and images.

## Project Structure

```
/
├── frontend/     # React + Tailwind CSS (Vite)
└── backend/      # Node.js + Express + MongoDB
```

## Prerequisites

- Node.js v18+
- MongoDB (local or Atlas) — optional, only needed for admin analytics
- FFmpeg — required for audio/video conversion
- LibreOffice — required for document conversion (PDF ↔ Word/PPT)

### Install FFmpeg

**Windows:** Download from https://ffmpeg.org/download.html and add to PATH
Or via Chocolatey: `choco install ffmpeg`

**macOS:** `brew install ffmpeg`

**Linux:** `sudo apt install ffmpeg`

### Install LibreOffice (for document conversion)

Download from https://www.libreoffice.org/download/download/

## Setup & Run

### 1. Backend

```bash
cd backend
cp .env.example .env      # Edit with your values
npm install
npm run dev               # Runs on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev               # Runs on http://localhost:5173
```

## Environment Variables (backend/.env)

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/fileconverter
JWT_SECRET=your_secret_key
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
```

## Admin Panel

Visit: `http://localhost:5173/adminsetup`

Login with credentials from your `.env` file.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/audio/convert | Convert audio files |
| POST | /api/video/convert | Convert video files |
| POST | /api/document/convert | Convert documents |
| POST | /api/image/compress | Compress/convert images |
| POST | /api/file/compress | Compress files / create ZIP |
| POST | /api/admin/login | Admin login |
| GET | /api/admin/dashboard | Analytics (auth required) |

## Supported Formats

- **Audio:** MP3, WAV, AAC, OGG, FLAC, M4A, WMA, AIFF, AMR
- **Video:** MP4, AVI, MKV, MOV, WMV, FLV, WebM, MPEG, 3GP
- **Documents:** PDF, DOC, DOCX, PPT, PPTX, TXT, RTF, ODT
- **Images:** JPG, PNG, WebP, GIF, BMP, TIFF, SVG
- **Compression:** ZIP, PDF, Images, Documents

## Notes

- Max file size: 50MB
- Files are auto-deleted after processing
- Document conversion (PDF↔Word/PPT) requires LibreOffice installed
- Audio/video conversion requires FFmpeg installed
