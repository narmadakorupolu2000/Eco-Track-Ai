# 🌍 EcoTrack AI - Smart Carbon Footprint Tracking Platform

<div align="center">

![EcoTrack AI](https://img.shields.io/badge/EcoTrack-AI%20Powered-green?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?style=for-the-badge&logo=fastapi)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)

**Track, Reduce, and Offset Your Carbon Footprint with AI-Powered Insights**

[Live Demo](https://eco-track-ai.netlify.app/) • [Documentation](#-documentation) • [Features](#-features) • [API Docs](./docs/TRACKING_API.md)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [Documentation](#-documentation)
- [API Reference](#-api-reference)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**EcoTrack AI** is a comprehensive carbon footprint tracking platform that helps individuals and organizations monitor, analyze, and reduce their environmental impact. Using advanced AI models and real-world carbon emission factors, EcoTrack provides:

- 🔢 **Automatic Carbon Calculations** - Smart activity logging with 30+ emission factors
- 🏆 **Gamification** - Achievements, streaks, points, and levels to motivate eco-friendly behavior
- 📊 **Personalized Insights** - AI-generated recommendations based on your activity patterns
- 🎯 **Goal Tracking** - Set and monitor weekly/monthly carbon reduction targets
- 🤖 **AI Waste Classifier** - Identify waste types and disposal methods using Perplexity AI
- 💬 **EcoChat** - Interactive AI assistant for sustainability questions

---

## ✨ Features

### 🌱 Core Features

#### 1. **Smart Carbon Tracking**
- Log activities across 4 categories: Transportation, Energy, Food, Waste
- Automatic carbon impact calculation using scientific emission factors
- Real-time points and streak tracking
- Activity history with detailed breakdown

#### 2. **AI-Powered Waste Classification**
- Upload images of waste items
- AI identifies waste type (plastic, metal, organic, etc.)
- Provides disposal recommendations and recycling tips
- Powered by Perplexity AI's `sonar-pro` model

#### 3. **Personalized Insights**
- Dynamic insights based on your behavior patterns
- Carbon savings converted to tree equivalency
- Category-specific tips (transportation, energy, food)
- Goal progress notifications
- Level-up reminders

#### 4. **Gamification System**
- **6 Achievements** to unlock (Week Warrior, Carbon Saver, etc.)
- **Streak System** - Daily tracking rewards
- **Points & Levels** - From Eco Beginner to Eco Legend
- **Leaderboard-ready** architecture

#### 5. **Goal Management**
- Set weekly/monthly carbon reduction goals
- Real-time progress tracking
- Visual progress bars
- Goal completion notifications

#### 6. **EcoChat Assistant**
- Interactive AI chatbot for sustainability questions
- Context-aware responses
- Eco-friendly tips and recommendations
- Powered by Groq AI (Llama 3.3 70B)

#### 7. **User Dashboard**
- Comprehensive stats overview
- Carbon footprint visualization
- Activity trends (6-month history)
- Community impact metrics

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 14 (React 18)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui components
- **State Management:** React Hooks
- **HTTP Client:** Fetch API
- **Deployment:** Netlify

### Backend
- **Framework:** FastAPI (Python 3.13)
- **Database:** MongoDB Atlas
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** bcrypt
- **CORS:** Configured for multiple origins
- **Deployment:** Render

### AI/ML
- **Waste Classification:** Perplexity AI (`sonar-pro`)
- **Chat Assistant:** Groq AI (Llama 3.3 70B Versatile)
- **Carbon Calculations:** Custom emission factors database

---

## 📁 Project Structure

```
ecotrack2/
├── app/                          # Next.js app directory
│   ├── about/                    # About page
│   ├── achievements/             # Achievements page
│   ├── admin/                    # Admin dashboard
│   ├── api/                      # Next.js API routes
│   │   ├── auth/                 # NextAuth.js config
│   │   ├── chat/                 # EcoChat endpoint
│   │   ├── waste-classify/       # Waste classification
│   │   └── ...
│   ├── contact/                  # Contact page
│   ├── dashboard/                # User dashboard
│   ├── eco-chat/                 # Chat interface
│   ├── features/                 # Features showcase
│   ├── login/                    # Login page
│   ├── register/                 # Registration page
│   ├── tracking/                 # Carbon tracking (main feature)
│   ├── waste-classifier/         # Waste classifier UI
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Homepage
├── backend/                      # FastAPI backend
│   ├── app/
│   │   ├── models/               # Pydantic models
│   │   ├── routers/              # API route handlers
│   │   ├── utils/                # Helper functions
│   │   ├── auth.py               # Authentication logic
│   │   └── database.py           # MongoDB connection
│   ├── main.py                   # FastAPI app entry point
│   └── requirements.txt          # Python dependencies
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   ├── providers.tsx             # Context providers
│   └── theme-provider.tsx        # Dark mode support
├── contexts/                     # React contexts
├── hooks/                        # Custom React hooks
├── lib/                          # Utility libraries
├── public/                       # Static assets
├── docs/                         # Documentation (created)
│   ├── TRACKING_API.md           # Tracking API reference
│   ├── HOW_INSIGHTS_WORK.md      # Insights system guide
│   └── TRACKING_FIXES.md         # Recent fixes log
├── .env.local                    # Frontend environment variables
├── .gitignore                    # Git ignore rules
├── next.config.mjs               # Next.js configuration
├── package.json                  # Node dependencies
├── tailwind.config.ts            # Tailwind CSS config
└── README.md                     # This file
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/pnpm
- Python 3.13+
- MongoDB Atlas account
- API keys: Perplexity AI, Groq AI

### 1. Clone the Repository
```bash
git clone https://github.com/narmadakorupolu2000/Eco-Track-Ai.git
cd Eco-Track-Ai
```

### 2. Install Frontend Dependencies
```bash
npm install
# or
pnpm install

# Dependencies are listed in:
# - package.json (official npm dependencies)
# - frontend-requirements.txt (reference/documentation)
```

### 3. Install Backend Dependencies
```bash
# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r backend-requirements.txt

# Note: There are 3 requirements files:
# - backend-requirements.txt (Python dependencies - use this)
# - frontend-requirements.txt (npm dependencies reference)
# - all-requirements.txt (combined reference - not tracked in git)
```

### 4. Set Up Environment Variables

**Frontend (.env.local):**
```env
NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
GROQ_API_KEY=your-groq-api-key
```

**Backend (backend/.env):**
```env
MONGODB_URL=your-mongodb-atlas-connection-string
JWT_SECRET=your-jwt-secret-key
PERPLEXITY_API_KEY=your-perplexity-api-key

# Optional: Email configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SENDER_EMAIL=your-email@gmail.com
SENDER_PASSWORD=your-app-password
RECIPIENT_EMAIL=admin@ecotrack.com
```

### 5. Run the Development Servers

**Backend (Terminal 1):**
```bash
cd backend
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

**Frontend (Terminal 2):**
```bash
npm run dev
```

**Access the app:**
- Frontend: http://localhost:3000
- Backend API: http://127.0.0.1:8000
- API Docs: http://127.0.0.1:8000/docs

---

## 🔐 Environment Variables

### Frontend Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_BACKEND_URL` | Backend API URL | Yes | `http://127.0.0.1:8000` |
| `NEXTAUTH_SECRET` | NextAuth.js secret key | Yes | - |
| `NEXTAUTH_URL` | Frontend URL | Yes | `http://localhost:3000` |
| `GROQ_API_KEY` | Groq AI API key (for chat) | Yes | - |

### Backend Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `MONGODB_URL` | MongoDB Atlas connection string | Yes | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `PERPLEXITY_API_KEY` | Perplexity AI key (waste classifier) | Yes | - |
| `SMTP_SERVER` | Email server (optional) | No | `smtp.gmail.com` |
| `SMTP_PORT` | Email port (optional) | No | `587` |
| `SENDER_EMAIL` | Sender email (optional) | No | - |
| `SENDER_PASSWORD` | Email password (optional) | No | - |

---

## 🌐 Deployment

### Frontend - Netlify

1. **Build Configuration:**
   - Build Command: `npm run build`
   - Publish Directory: `.next`
   - Node Version: 18+

2. **Environment Variables:** Add all `NEXT_PUBLIC_*` variables in Netlify dashboard

3. **Deploy:**
```bash
npm run build
# Netlify auto-deploys from GitHub
```

### Backend - Render

1. **Create Web Service** on Render

2. **Build Configuration:**
   - Environment: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

3. **Environment Variables:** Add all backend variables in Render dashboard

4. **Update Frontend:**
```env
NEXT_PUBLIC_BACKEND_URL=https://your-render-app.onrender.com
```

---

## 📚 Documentation

- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Complete deployment instructions for Netlify + Render
- **[Tracking API Reference](./docs/TRACKING_API.md)** - Complete API documentation for carbon tracking
- **[How Insights Work](./docs/HOW_INSIGHTS_WORK.md)** - Deep dive into the insights generation system
- **[Waste Classifier Guide](./docs/WASTE_CLASSIFIER.md)** - How to use the AI waste classifier
- **[Carbon Tracking Guide](./docs/CARBON_TRACKING.md)** - Log activities and track emissions
- **[Goals & Achievements](./docs/GOALS_ACHIEVEMENTS.md)** - Gamification system explained
- **[EcoChat Guide](./docs/ECOCHAT.md)** - Using the AI chatbot

### Quick Links
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Troubleshooting](./docs/DEPLOYMENT.md#-troubleshooting)

---

## 🔌 API Reference

### Base URLs
- **Development:** `http://127.0.0.1:8000`
- **Production:** `https://your-render-app.onrender.com`

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/token` - Login and get JWT token
- `GET /api/auth/me` - Get current user profile

#### Carbon Tracking
- `POST /api/tracking/log` - Log activity (smart mode)
- `GET /api/tracking/history` - Get activity history
- `GET /api/carbon/monthly` - Monthly carbon footprint
- `GET /api/carbon/trends` - 6-month trend data

#### Insights & Goals
- `GET /api/user/insights` - Personalized insights
- `GET /api/user/achievements` - All achievements
- `POST /api/user/goals` - Create goal
- `GET /api/user/goals` - Get active goals with progress

#### Waste Classification
- `POST /api/waste-classify-perplexity` - Classify waste image

#### Dashboard
- `GET /api/user/dashboard` - Comprehensive user stats
- `GET /api/user/stats` - User statistics

**Full API documentation:** [docs/TRACKING_API.md](./docs/TRACKING_API.md)

---

## 🤝 Contributing

We welcome contributions! Here's how:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript/Python best practices
- Add tests for new features
- Update documentation
- Ensure all linters pass

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Carbon Emission Factors:** Based on EPA and IPCC guidelines
- **AI Models:** Perplexity AI, Groq AI
- **UI Components:** shadcn/ui
- **Icons:** Lucide Icons

---

## 📞 Contact

- **GitHub:** [@narmadakorupolu2000](https://github.com/narmadakorupolu2000)
- **Project:** [Eco-Track-Ai](https://github.com/narmadakorupolu2000/Eco-Track-Ai)
- **Live Demo:** [https://eco-track-ai.netlify.app/](https://eco-track-ai.netlify.app/)

---

<div align="center">

**Made with 💚 for a sustainable future**

⭐ Star this repo if you find it helpful!

</div>


🏗️ Build for Production
bash
npm run build
npm start

🌐 Deployment
This project is deployed on Netlify. Each push to the main branch automatically triggers a new deployment.
Live URL: https://eco-track-ai.netlify.app/

👨‍💻 Author
Developed by @narmadakorupolu2000
