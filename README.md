# Knowledge Hub - MERN Stack Application

A modern, advanced Knowledge Management System built with the MERN (MongoDB, Express, React, Node.js) stack. This application allows teams to curate, share, and discuss knowledge through a polished and feature-rich interface.

## 🚀 Key Features

*   **Article Library:** Create, edit, and manage articles with a rich text editor.
*   **Modern UI/UX:** Clean, responsive design with support for **Dark Mode**.
*   **Advanced Search:** Real-time, debounced search with filtering by category and tags.
*   **Collaboration:** Integrated threaded comment system for article discussions.
*   **Performance:** Backend pagination (limit 4 per page) for efficient data loading.
*   **Content Management:** Support for drafts, categories, and tags.
*   **Security:** JWT-based authentication and role-based access control (Admin/User).
*   **Live Database:** Pre-configured for MongoDB Atlas connectivity.

## 🛠️ Tech Stack

- **Frontend:** React, Vite, React Router, CSS Variables (Theming), Lucide Icons.
- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT.
- **Tools:** Concurrently (running client/server), Nodemon, DOMPurify (sanitization), Marked (Markdown parsing).

---

## 🏁 Getting Started

Follow these steps to get the project up and running on your local machine.

### 1. Prerequisites
- [Node.js](https://nodejs.org/) installed (v16+ recommended).
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (or a local MongoDB instance).

### 2. Environment Setup

#### Backend (`/server/.env`):
Create a `.env` file in the `server` folder with the following:
```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_random_secret_string
```

#### Frontend (`/client/.env`):
Create a `.env` file in the `client` folder with the following:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Installation
From the root directory, run the following command to install dependencies for the root, client, and server:
```bash
npm install
cd client && npm install
cd ../server && npm install
cd ..
```

### 4. Running the Application
You can start both the frontend and backend concurrently from the root directory:
```bash
npm run dev
```

*   **Frontend:** [http://localhost:5173/](http://localhost:5173/)
*   **Backend:** [http://localhost:5000/](http://localhost:5000/)

---

## 📁 Project Structure

```text
/
├── client/          # React (Vite) frontend
├── server/          # Express backend
├── package.json     # Root scripts for monorepo management
└── .gitignore       # Consolidated Git exclusions
```

## 📜 Available Scripts

- `npm run dev`: Runs both client and server in development mode.
- `npm run dev:client`: Runs only the frontend.
- `npm run dev:server`: Runs only the backend.

---

## 🛡️ License
This project is private.
