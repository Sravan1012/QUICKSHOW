# 🎬 QuickShow – Movie Ticket Booking System

QuickShow is a modern **movie ticket booking web application** built using **React** and **Tailwind CSS**.  
It allows users to browse movies, view details, select seats, and book tickets with secure authentication.

This project was built by following **GreatStack**, with integrations and enhancements to resemble a real-world ticket booking platform.

---

## 🚀 Features

- 🎥 Browse trending and popular movies using TMDB API
- 🔍 View detailed movie information
- 💺 Seat selection with availability handling
- 🔐 Secure authentication using Clerk
- 🎟️ Ticket booking workflow
- 📱 Fully responsive UI with Tailwind CSS
- ☁️ Deployed on Vercel

---

## 🛠️ Tech Stack

### Frontend
- React.js
- JavaScript
- Tailwind CSS
- HTML5

### Authentication
- Clerk

### API
- TMDB (The Movie Database)

### Deployment
- Vercel

---

## ⚙️ Installation & Setup

> Copy-paste the following script in your terminal to set up the project locally:

```bash
# 1️⃣ Clone your repo
git clone https://github.com/Sravan1012/QUICKSHOW.git

# 2️⃣ Move into the project directory
cd QUICKSHOW

# 3️⃣ Install dependencies
npm install

# 4️⃣ Create a .env file with placeholder variables
cat <<EOL > .env
VITE_CURRENCY=₹
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_TMDB_API_KEY=your_tmdb_api_key
VITE_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p/original
EOL

# 5️⃣ Start the development server
npm run dev


