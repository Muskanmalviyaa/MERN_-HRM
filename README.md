# MERN Project

This project has been organized into `frontend` and `backend` folders.

## Backend (Node.js)
- **Location**: `backend/`
- **Main Entry**: `index.js`
- **Database**: Drizzle ORM (PostgreSQL)
- **Authentication**: Clerk
- **Scripts**:
  - `npm install`: Install dependencies
  - `npm run dev`: Start server with nodemon
  - `npm start`: Start production server

## Frontend (React.js)
- **Location**: `frontend/`
- **Main Entry**: `src/main.jsx`
- **Styling**: Tailwind CSS
- **API Connection**: Configured in `src/lib/api.js`
- **Scripts**:
  - `npm install`: Install dependencies
  - `npm run dev`: Start Vite development server
  - `npm run build`: Build for production

## How to Connect API
1. Set the `VITE_API_URL` environment variable in `frontend/.env`.
2. Default is `http://localhost:5000/api`.

## Note on Types
The code has been renamed to `.js` and `.jsx`. Some complex TypeScript annotations might still be present in the logic and should be removed if they cause syntax errors in your environment.
