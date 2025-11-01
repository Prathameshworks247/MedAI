# 🚀 Quick Start Guide - MediPortal Prototype

## Get the App Running in 3 Steps

### Step 1: Install Dependencies
```bash
cd frontend
npm install
```

### Step 2: Start Development Server
```bash
npm run dev
```

### Step 3: Open Browser
The app will automatically open at `http://localhost:3000`

---

## 🎯 Demo Navigation

### Option 1: Doctor Portal
1. Click "Enter Doctor Portal" on home page
2. Explore features:
   - **Dashboard**: Overview of patient data
   - **Audio & Transcription**: View recorded consultation
   - **Clinical Report**: See AI-generated medical report
   - **Test Results & Trends**: Interactive charts showing patient health trends
   - **AI Diagnostic Insights**: Comprehensive diagnostic analysis

### Option 2: Patient Portal
1. Click "Enter Patient Portal" on home page
2. Explore features:
   - **Dashboard**: Quick overview of health status
   - **My Medications**: Detailed medication schedule
   - **Ask Questions**: Chat with AI health assistant
   - **Diet Plan**: Personalized nutrition recommendations
   - **Notifications**: Health alerts and reminders

---

## 📊 Key Demo Features to Showcase

### 1. **Interactive Charts** (Doctor Portal → Test Results)
- Beautiful visualizations of patient test trends over time
- Multiple health parameters: WBC, RBC, Hemoglobin, Glucose, Cholesterol
- Click on different metrics to see individual trends

### 2. **AI Diagnostic Insights** (Doctor Portal → AI Insights)
- Comprehensive analysis with risk assessment
- Color-coded severity indicators
- Clinical recommendations
- Differential diagnosis

### 3. **Patient Chatbot** (Patient Portal → Ask Questions)
- Try asking: "When do I take my medicine?"
- Try: "What diet should I follow?"
- Interactive AI responses with quick question buttons

### 4. **Medication Management** (Patient Portal → Medications)
- Organized by time of day (Morning, Evening, Night)
- Detailed instructions for each medication
- Purpose and dosage information

---

## 💡 Presentation Tips

1. **Start with Home Page**: Show the clean, professional landing page
2. **Doctor Portal First**: Demonstrate the clinical workflow
   - Audio → Report → Tests → AI Insights
3. **Patient Portal Second**: Show the patient-friendly features
   - Easy-to-understand medication schedules
   - Simple chatbot for common questions
4. **Highlight Key Features**:
   - ✨ AI-powered transcription and report generation
   - 📊 Beautiful data visualization with Recharts
   - 🤖 Intelligent chatbot for patient queries
   - 💊 Clear medication management
   - 🍎 Personalized diet recommendations

---

## 🎨 Design Highlights

- **Modern UI**: Clean, professional design with Tailwind CSS
- **Responsive**: Works on desktop and tablet
- **Intuitive Navigation**: Clear sidebar navigation in both portals
- **Color Coding**:
  - Doctor Portal: Blue theme
  - Patient Portal: Green theme
  - Severity indicators: Red (high), Yellow (moderate), Green (low)

---

## 🐛 Troubleshooting

### Port Already in Use?
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
npm run dev -- --port 3001
```

### Dependencies Not Installing?
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Issues?
```bash
# Try with specific Node version (v18 recommended)
nvm use 18
npm install
npm run dev
```

---

## 📱 Browser Compatibility

- ✅ Chrome (Recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge

---

## 🎯 Sample Data Overview

**Patient**: Rajesh Sharma, 58 years, Male
**Chief Complaint**: Chest pain and shortness of breath
**Doctor**: Dr. Priya Mehta, MD (Cardiology)
**Diagnosis**: Suspected stable angina pectoris

The app includes:
- 5 historical test results with trends
- 4 prescribed medications
- 5+ notifications
- Comprehensive diet plan
- Multiple chatbot FAQs

---

## 📝 Notes for Judges/Evaluators

- This is a **frontend-only prototype** with no backend
- All data is **hardcoded** in `src/data/dummyData.js`
- AI features are **simulated** to demonstrate the concept
- Focus is on **UI/UX design** and **workflow demonstration**
- Ready for integration with actual AI APIs (OpenAI, Whisper, etc.)

---

## 🚀 What's Next (If Building Further)

1. **Backend Integration**:
   - FastAPI server for API endpoints
   - OpenAI GPT-4 for report generation
   - Whisper API for audio transcription
   - Firebase for push notifications

2. **Database**:
   - PostgreSQL for patient records
   - MongoDB for unstructured clinical notes
   - Redis for caching

3. **Authentication**:
   - OAuth2 for doctor login
   - Access codes for patient login
   - JWT tokens

4. **Additional Features**:
   - Video consultations
   - Prescription generation
   - Lab integration
   - Appointment scheduling

---

## 📧 Support

For any issues or questions during the demo, check the README.md file or inspect the console for errors.

**Good luck with your Ideathon presentation! 🎉**

