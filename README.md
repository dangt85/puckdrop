# Puck Drop

A hockey-themed voice-powered ice time booking application built with Next.js, Vapi AI, and MongoDB.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: MongoDB with Mongoose
- **Voice AI**: Vapi
- **Containerization**: Docker + Docker Compose

## Features

- Voice-powered booking via Vapi AI assistant
- Real-time availability checking
- Multiple facility support
- 24/7 automated booking
- Modern responsive UI

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Vapi account (https://vapi.ai)

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**

   Edit `.env.local`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/puckdrop
   VAPI_API_KEY=your_private_key
   NEXT_PUBLIC_VAPI_API_KEY=your_public_key
   ```

3. **Start MongoDB**
   ```bash
   docker-compose up -d mongodb
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open http://localhost:3000**

## Docker

### Development (MongoDB only)
```bash
docker-compose up -d mongodb
npm run dev
```

### Full Production Stack
```bash
docker-compose up --build
```

### Services
| Service | Port | Description |
|---------|------|-------------|
| app | 3000 | Next.js application |
| mongodb | 27017 | MongoDB database |
| mongo-express | 8081 | MongoDB admin UI |

## Vapi Integration

### Setup

1. Create account at https://vapi.ai
2. Get API keys from Dashboard > Settings > API Keys
3. Add keys to `.env.local`

### How It Works

The voice assistant handles:
- **checkAvailability** - Query available time slots
- **bookAppointment** - Create new bookings
- **cancelAppointment** - Cancel existing bookings
- **getFacilities** - List available rinks

### Testing

1. Click "Try Voice Booking" on the homepage
2. Allow microphone access
3. Say: "I want to book ice time for tomorrow at 3pm"

## API Routes

### GET /api/bookings
Query bookings with optional filters.

**Parameters:**
- `date` - Filter by date (YYYY-MM-DD)
- `facilityId` - Filter by facility

### POST /api/bookings
Create a new booking.

**Body:**
```json
{
  "facilityId": "rink-1",
  "facilityName": "Central Ice Arena",
  "date": "2025-01-15",
  "timeSlot": "14:00",
  "customerName": "John Doe",
  "customerPhone": "555-0123",
  "bookingType": "ice_time"
}
```

### POST /api/vapi/webhook
Handles Vapi function calls for the voice assistant.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── bookings/route.ts
│   │   └── vapi/webhook/route.ts
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── marketing/
│   │   ├── Hero.tsx
│   │   └── Features.tsx
│   ├── vapi/
│   │   └── VoiceBooking.tsx
│   └── ui/
├── hooks/
│   └── useVapi.ts
├── lib/
│   ├── mongodb.ts
│   └── utils.ts
└── models/
    └── Booking.ts
```

## Available Facilities

| ID | Name | Address |
|----|------|---------|
| rink-1 | Central Ice Arena | 123 Main St |
| rink-2 | Northside Ice Complex | 456 North Ave |
| rink-3 | Southgate Skating Center | 789 South Blvd |

## License

MIT
