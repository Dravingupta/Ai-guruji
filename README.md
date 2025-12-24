# 🧘‍♂️ Indian AI Fitness Coach – *Guru-ji*

**Your Personalized AI Guru for Health & Wellness 🇮🇳**

Indian AI Fitness Coach is a **full-stack, AI-powered Progressive Web Application (PWA)** designed specifically for the **Indian demographic**.  
It leverages **Google Gemini models**, **Firebase Authentication**, and **MongoDB** to deliver **secure, hyper-personalized fitness coaching** tailored to Indian food habits, budgets, and lifestyles.

Whether your goal is **fat loss, muscle gain, or overall fitness**, *Guru-ji* acts as your **24/7 AI fitness coach**.

---

## 🚀 Key Features

### 🥗 Hyper-Localized Diet Planning
- **Region-Specific Meals**  
  North, South, East & West Indian cuisines (Roti/Dal, Idli/Dosa, Rice meals, etc.)
- **Diet Preferences Supported**  
  Vegetarian, Non-Vegetarian, Jain
- **Budget-Aware AI**  
  - Low: Lentils, seasonal vegetables  
  - Medium: Balanced staples  
  - Flexible: Premium options (Greek yogurt, nuts, avocados)
- **Allergy-Safe Recipes**  
  AI guardrails to strictly exclude allergens
- **One-Click Meal Swap**  
  Replace meals with calorie-matched alternatives instantly

---

### 🏋️ Adaptive Workout Routines
- **Home or Gym Based Plans**
  - Equipment-free workouts
  - Structured gym splits (Push / Pull / Legs)
- **AI-Designed Structure**
  - Warm-up
  - Main workout (sets & reps)
  - Cool-down
- **Manual Activity Logging**
  - Walking, cricket, yoga, etc.
  - Estimated calorie burn calculation

---

### 🤖 AI Body Analysis (Computer Vision)
- **Gemini Vision Integration**
- Upload a full-body image to get:
  - Somatotype detection (Ectomorph / Mesomorph / Endomorph)
  - Basic posture insights
- **Privacy-Focused Design**
  - Images are processed securely and not permanently stored

---

### 💬 “Guru-ji” AI Chatbot
- **Context-Aware Coaching**
  - Knows your goals, diet, workouts & injuries
- **Ask Anything**
  - Exercise form guidance
  - Food substitutions
  - Motivation & habit building
- Friendly **Indian Guru persona**

---

### 📊 Smart Tracking & Dashboard
- **Calories In vs Calories Out**
- **Macro Tracking**
  - Protein, Carbs, Fats (auto + custom goals)
- **Progress History**
  - Daily logs
  - Weekly summaries
- **Gamification**
  - Streaks & consistency badges

---

## 🔐 Authentication & Data Management

### 🔑 Firebase Authentication
- Secure user authentication using:
  - Email & Password
  - Google Sign-In (optional)
- Handles:
  - User sessions
  - Protected routes
  - Auth state persistence

### 🗄 MongoDB (Persistent Storage)
- Stores:
  - User profiles & preferences
  - Generated diet & workout plans
  - Daily logs & activity history
  - Chat context (optional)
- Enables:
  - Cross-device access
  - Data persistence beyond browser storage

---

## 🛠 Tech Stack

### Frontend
- **React.js (v19)**
- **TypeScript**
- **Tailwind CSS**
  - Dark Mode support

### Backend
- **Node.js**
- **Express.js**
- **MongoDB**
  - Mongoose ODM

### Authentication
- **Firebase Authentication**

### AI Integration
- **Google GenAI SDK** (`@google/genai`)
- **Models Used**
  - `gemini-3-pro-preview` – Diet & Workout reasoning
  - `gemini-2.5-flash` – Chat & text generation
  - `gemini-2.5-flash-image` – Vision analysis

### Other Tools
- **Icons:** Lucide React
- **State Management:** React Hooks
- **API Communication:** REST APIs

---

## 📱 User Experience
- **Mobile-First PWA Design**
- **Dark Mode**
  - System-aware theme switching
- **Secure & Private**
  - Auth-protected data
  - Encrypted communication
- **Smooth Onboarding**
  - Age, height, weight
  - Goals & diet preferences

---

## 🔮 Future Roadmap
- 📦 Offline PWA support
- 🎙 Voice coaching – *“Talk to Guru-ji”*
- 📤 Social sharing (WhatsApp / Instagram)
- 📊 Advanced analytics & health insights

---

## 🧑‍💻 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas or Local MongoDB
- Firebase Project
- Google Gemini API Key

### Setup

```bash
# Clone repository
git clone https://github.com/your-username/indian-ai-fitness-coach.git

# Install dependencies
npm install

# Start frontend
npm run dev

# Start backend
npm run server
