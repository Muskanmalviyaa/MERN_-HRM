# AttendEase 🚀 - Attendance Management System

AttendEase is a comprehensive MERN-stack application designed to streamline employee attendance tracking, overtime management, and reporting. It features a modern, responsive UI, real-time updates via Socket.io, and secure role-based access control.

---

## 🔗 Project Links

- **GitHub Repository**: [https://github.com/Muskanmalviyaa/MERN_-HRM.git](https://github.com/Muskanmalviyaa/MERN_-HRM.git)
- **Live Frontend**: [https://mern-hrm-2.onrender.com](https://mern-hrm-2.onrender.com)
- **Live Backend API**: [https://mern-hrm-1.onrender.com](https://mern-hrm-1.onrender.com)

---

## 🌟 Key Features

- **🔐 Secure Authentication**: JWT-based login and signup with role-based access control (Admin, Manager, Employee).
- **⏱️ Attendance Tracking**: Real-time Punch In/Out system with location and identity verification.
- **📊 Interactive Dashboard**: Visual stats and summaries for both employees and management.
- **🕒 Overtime Management**: Request and review overtime hours with a dedicated approval workflow.
- **📄 Comprehensive Reports**: Generate and view attendance reports with filtering and search capabilities.
- **📱 Responsive Design**: Optimized for all devices using Tailwind CSS.
- **⚡ Real-time Updates**: Powered by Socket.io for instant data synchronization.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React.js (Vite)
- **State Management**: Redux Toolkit & RTK Query
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Security**: Helmet, CORS, Express Rate Limit
- **Communication**: Socket.io

---

## 📂 Project Structure

```text
mern-hrm/
├── backend/            # Express API & MongoDB Logic
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── models/       # Database schemas
│   │   ├── routes/       # API endpoints
│   │   └── middlewares/  # Auth & Error handling
│   └── index.js          # Entry point
├── frontend/           # React Application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Main screen views
│   │   └── store/        # Redux state & API slices
│   └── index.html
└── Attached-Assets/    # Media and design assets
```

---

## ⚙️ Installation & Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/Muskanmalviyaa/MERN_-HRM.git
cd MERN_-HRM
```

### 2. Setup Backend
```bash
cd backend
npm install
```
Create a `.env` file in the `backend/` folder:
```env
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```
Start the backend:
```bash
npm run dev
```

### 3. Setup Frontend
```bash
cd ../frontend
npm install
```
Create a `.env` file in the `frontend/` folder:
```env
VITE_API_URL=http://localhost:5001/api
```
Start the frontend:
```bash
npm run dev
```

---

## 🚀 Deployment

### Backend (Render Web Service)
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Variables**: Add `MONGO_URI`, `JWT_SECRET`, `NODE_ENV=production`, and `CLIENT_ORIGIN` (your frontend URL).

### Frontend (Render Static Site)
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **SPA Support**: A `_redirects` file is included in the `public/` folder to handle routing.
- **Environment Variables**: Add `VITE_API_URL` (your backend URL).

---

## 📄 License
This project is for educational purposes as part of a technical assessment.
