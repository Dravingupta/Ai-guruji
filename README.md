# 🏋️ AI Guruji - Indian AI Fitness Coach

An intelligent, AI-powered fitness and nutrition coach specifically designed for Indian users. Get personalized diet plans, home workout routines, and real-time coaching powered by advanced AI technology.

The interface has been redesigned with an athletic dark visual system, lime accents, responsive navigation, and new layouts across every screen. See [design notes](docs/DESIGN.md) for styling ownership and verification.

## Architecture and future changes

AI agents should start with [AGENTS.md](AGENTS.md), then use the [architecture and change reference](docs/ARCHITECTURE.md) for runtime flows, every source file's responsibility, API/data contracts, browser storage, configuration, known gaps, and a task-to-file change map. The reference describes the audited implementation and takes precedence over older feature/setup claims below when they differ.

Copy [backend/.env.example](backend/.env.example) to `backend/.env` and [client/.env.example](client/.env.example) to `client/.env`, then replace the credential placeholders. Use the same Firebase project for both packages. Existing `.env` files should be edited in place rather than overwritten. Real `.env` files are ignored by Git; the example templates are trackable.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.2.0-61dafb.svg)
![Node.js](https://img.shields.io/badge/Node.js-Express-green.svg)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248.svg)

## ✨ Features

### 🍽️ Personalized Diet Plans
- **Indian Cuisine Focus**: Meal plans featuring authentic Indian dishes tailored to your region
- **Budget-Aware**: Plans adapted to low, medium, or high budget constraints
- **Allergy Management**: Automatic exclusion of allergens from meal suggestions
- **Detailed Recipes**: Complete ingredient lists, cooking steps, prep time, and nutritional breakdown
- **Meal Swapping**: Instantly swap any meal for an alternative while maintaining nutritional goals
- **Macro Tracking**: Automatic or custom macro calculations (protein, carbs, fats)

### 💪 Workout Programs
- **7-Day Plans**: Complete weekly workout schedules with progressive difficulty
- **Home & Gym Options**: Exercises tailored to your workout preference
- **Goal-Oriented**: Programs designed for weight loss, muscle gain, or general fitness
- **Detailed Instructions**: Exercise descriptions, sets, reps, and estimated calorie burn
- **Warm-up & Cool-down**: Comprehensive routines for injury prevention

### 🤖 AI Chat Coach
- **Real-time Guidance**: Chat with your personal AI fitness coach
- **Context-Aware**: Remembers your profile, goals, and conversation history
- **Motivational Support**: Encouraging advice and accountability
- **Expert Knowledge**: Nutrition and fitness expertise tailored to Indian lifestyle

### 👤 User Profile Management
- **Comprehensive Profiling**: Age, height, weight, gender, body type analysis
- **Goal Setting**: Weight loss, muscle gain, or maintenance
- **Activity Tracking**: Customize based on your activity level
- **Dietary Preferences**: Vegetarian, non-vegetarian, vegan options
- **Regional Customization**: Meal plans based on your Indian region

### 🎨 Modern UI/UX
- **Dark Mode**: Eye-friendly dark theme support
- **Responsive Design**: Seamless experience across desktop, tablet, and mobile
- **Intuitive Navigation**: Easy-to-use dashboard with organized sections
- **Real-time Updates**: Instant feedback and loading states

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18.2.0
- **Build Tool**: Vite 5.0
- **Styling**: TailwindCSS 3.3.5
- **Routing**: React Router DOM 6.30.2
- **Icons**: Lucide React
- **Authentication**: Firebase 10.0
- **HTTP Client**: Axios 1.6.0

### Backend
- **Runtime**: Node.js with ES Modules
- **Framework**: Express 4.18.2
- **Database**: MongoDB with Mongoose 8.0.0
- **Authentication**: Firebase Admin SDK 12.0.0
- **AI Service**: Google Gemini Interactions API (`@google/genai`; `GEMINI_MODEL`, default `gemini-3.6-flash`)
- **CORS**: Enabled for frontend communication

### Infrastructure
- **Frontend Deployment**: Vercel
- **Backend Deployment**: Render
- **Database Hosting**: MongoDB Atlas (recommended)
- **Authentication**: Firebase Authentication

## 📁 Project Structure

```
Ai-guruji/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js          # MongoDB connection
│   │   │   └── firebase.js          # Firebase Admin initialization
│   │   ├── controllers/
│   │   │   ├── authController.js    # Authentication logic
│   │   │   ├── chatController.js    # AI chat endpoints
│   │   │   ├── dietController.js    # Diet plan generation
│   │   │   ├── userController.js    # User profile management
│   │   │   └── workoutController.js # Workout plan generation
│   │   ├── middlewares/
│   │   │   └── authMiddleware.js    # JWT verification
│   │   ├── models/
│   │   │   ├── User.js              # User schema
│   │   │   ├── DietPlan.js          # Diet plan schema
│   │   │   ├── WorkoutPlan.js       # Workout plan schema
│   │   │   └── ChatHistory.js       # Chat history schema
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── chatRoutes.js
│   │   │   ├── dietRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   └── workoutRoutes.js
│   │   ├── services/
│   │   │   └── deepseekService.js   # Gemini prompts and validation (historical filename)
│   │   ├── app.js                   # Express app configuration
│   │   └── server.js                # Server entry point
│   ├── package.json
│   └── .env                         # Environment variables
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth.jsx             # Login/Signup component
│   │   │   ├── LandingPage.jsx      # Home page
│   │   │   ├── ProfileForm.jsx      # User profile form
│   │   │   ├── Dashboard.jsx        # Main dashboard
│   │   │   ├── DietCard.jsx         # Diet plan display
│   │   │   ├── WorkoutCard.jsx      # Workout plan display
│   │   │   └── ChatCoach.jsx        # AI chat interface
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx      # Authentication state
│   │   │   └── ThemeContext.jsx     # Theme management
│   │   ├── hooks/
│   │   │   ├── useAuth.js           # Authentication hook
│   │   │   └── useTheme.js          # Theme hook
│   │   ├── services/
│   │   │   ├── backendService.js    # API calls
│   │   │   └── firebase.js          # Firebase config
│   │   ├── config/
│   │   │   └── firebase.js          # Firebase configuration
│   │   ├── App.jsx
│   │   ├── AppRouter.jsx            # Route configuration
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── vercel.json                  # Vercel deployment config
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v20 or higher; required by the Google SDK)
- MongoDB (local or Atlas)
- Firebase account
- Google Gemini API key

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/ai-guruji.git
cd ai-guruji
```

#### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# MongoDB
MONGODB_URI=mongodb://localhost:27017/ai-fitness-coach
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-fitness-coach

# Google Gemini (backend only)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.6-flash

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
```

**Getting API Keys:**
- **Google Gemini API**: Create a key in [Google AI Studio](https://aistudio.google.com/api-keys). Set it in `backend/.env` or server deployment secrets, never in client `VITE_*` variables. Restart the backend after changing the key. `GOOGLE_API_KEY` is also accepted when `GEMINI_API_KEY` is unset.
- **Firebase**: Create a project at [console.firebase.google.com](https://console.firebase.google.com) and download service account credentials

#### 3. Frontend Setup

```bash
cd ../client
npm install
```

Create a `.env` file in the `client` directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Running the Application

#### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

The application will be available at:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

#### Production Build

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd client
npm run build
npm run preview
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/verify` - Verify Firebase token and create/update user

### User Management
- `GET /api/users/profile` - Get user profile
- `POST /api/users/profile` - Create/update user profile

### Diet Plans
- `POST /api/diet/generate` - Generate personalized diet plan
- `GET /api/diet/current` - Get current diet plan
- `POST /api/diet/swap-meal` - Swap a specific meal

### Workout Plans
- `POST /api/workout/generate` - Generate weekly workout plan
- `GET /api/workout/current` - Get current workout plan

### AI Chat
- `POST /api/chat/message` - Send message to AI coach
- `GET /api/chat/history` - Get chat history

## 🎯 Usage Guide

### First Time Setup
1. **Sign Up**: Create an account using Google or email
2. **Complete Profile**: Fill in your personal details, goals, and preferences
3. **Generate Plans**: Click "Generate Diet Plan" and "Generate Workout Plan"
4. **Start Tracking**: Use the dashboard to track your progress

### Daily Workflow
1. Check your daily meal plan and prepare meals
2. Follow your workout routine for the day
3. Chat with AI coach for questions or motivation
4. Swap meals if needed based on availability or preference

### Customization
- Update your profile anytime to regenerate plans
- Toggle between auto and custom macro calculations
- Switch between light and dark themes
- Swap individual meals without regenerating entire plan

## 🔒 Security Features

- Firebase Authentication for secure user management
- JWT token verification on all protected routes
- Environment variables for sensitive data
- CORS configuration for API security
- Input validation and sanitization
- Secure password handling via Firebase

## 🌐 Deployment

### Frontend (Vercel)
```bash
cd client
vercel --prod
```

### Backend (Render)
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `cd backend && npm install`
4. Set start command: `cd backend && npm start`
5. Add environment variables from `.env`

### Database (MongoDB Atlas)
1. Create a cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Get connection string
3. Update `MONGODB_URI` in backend `.env`

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

**Dravin Gupta**

## 🙏 Acknowledgments

- Google Gemini for the language model API
- Firebase for authentication services
- MongoDB for database solutions
- React and Vite teams for excellent development tools
- TailwindCSS for beautiful styling utilities

## 📧 Support

For support, email dravingupta12@gmail.com or open an issue in the repository.

## 🔮 Future Enhancements

- [ ] Progress tracking with charts and analytics
- [ ] Meal prep planning and grocery lists
- [ ] Exercise video demonstrations
- [ ] Social features and community challenges
- [ ] Mobile app (React Native)
- [ ] Integration with fitness wearables
- [ ] Recipe rating and favorites
- [ ] Meal photo upload for calorie estimation
- [ ] Workout progress tracking with PR records
- [ ] Nutritionist consultation booking

---

**Made with ❤️ for the Indian fitness community**
