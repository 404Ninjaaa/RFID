<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# RFID Access Control System

A full-stack access control simulation with React frontend and Node.js/Express backend.

## Prerequisites
- Node.js (v18+)
- MongoDB (Ensure it is running locally or provide URI in `.env`)

## Installation

1. **Install Root Dependencies (Frontend)**
   ```bash
   npm install
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

3. **Environment Setup**
    - Ensure `.env` exists in `backend/` with `MONGODB_URI` and `PORT`.
    - (Optional) `.env` in root for Frontend config.

## Running the App

### Option 1: Run All (Recommended)
This command runs both the backend server and frontend development server concurrently.
```bash
npm start
```

### Option 2: Run Separately (Manual)
**Terminal 1 (Backend):**
```bash
cd backend
npm start
```

**Terminal 2 (Frontend):**
```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).
