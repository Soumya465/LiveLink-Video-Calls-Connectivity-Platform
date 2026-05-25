# LiveLink

A full-stack video calling application built with Node.js, Express, Socket.io, MongoDB, and React.

## Features

- User authentication and management
- Real-time video meetings using WebRTC and Socket.io
- Meeting history and user dashboard
- Responsive and modern UI

## Tech Stack

- **Backend:** Node.js, Express, Socket.io, MongoDB, Mongoose
- **Frontend:** React, Context API, CSS Modules

## Getting Started

### Prerequisites

- Node.js and npm
- MongoDB Atlas account (or local MongoDB)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sumitraiup55/Videocall.git
   cd Videocall
   ```

2. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up environment variables:**
   - Update MongoDB connection string in `backend/src/app.js` if needed.

### Running the App

- **Start the backend:**
  ```bash
  cd backend
  npm start
  ```

- **Start the frontend:**
  ```bash
  cd frontend
  npm start
  ```

- Visit `http://localhost:3000` in your browser.

## Folder Structure

```
backend/
  src/
    controllers/
    models/
    routes/
    app.js
frontend/
  src/
    pages/
    contexts/
    styles/
    utils/
```

## License

This project is licensed under the MIT License.
