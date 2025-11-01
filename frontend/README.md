# MediPortal - Healthcare Management System

A modern React-based prototype for a healthcare management system with separate portals for doctors and patients.

## 🚀 Features

### Doctor Portal
- **Audio Recording & Transcription**: Record patient consultations and view AI-generated transcriptions
- **Clinical Report Generation**: AI-powered structured clinical documentation
- **Test Results & Trends**: Upload and visualize patient test results with interactive charts
- **Diagnostic Insights**: AI-generated diagnostic recommendations based on comprehensive patient data

### Patient Portal
- **Medication Management**: View medication schedules with detailed instructions
- **AI Chatbot**: Ask questions about medications, diet, and care plans
- **Diet Recommendations**: Personalized nutrition plans for heart health
- **Notifications**: Medication reminders, appointment alerts, and test result updates

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## 🛠️ Installation

1. Install dependencies:
```bash
npm install
```

## 🚀 Running the Application

Start the development server:
```bash
npm run dev
```

The application will open automatically at `http://localhost:3000`

## 🗂️ Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── doctor/          # Doctor portal components
│   │   │   ├── DoctorDashboard.jsx
│   │   │   ├── AudioTranscription.jsx
│   │   │   ├── ClinicalReport.jsx
│   │   │   ├── TestResults.jsx
│   │   │   └── DiagnosticInsights.jsx
│   │   └── patient/         # Patient portal components
│   │       ├── PatientDashboard.jsx
│   │       ├── Medications.jsx
│   │       ├── Chatbot.jsx
│   │       ├── DietPlan.jsx
│   │       └── Notifications.jsx
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   ├── DoctorPortal.jsx
│   │   └── PatientPortal.jsx
│   ├── data/
│   │   └── dummyData.js     # All hardcoded data for prototype
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
└── vite.config.js
```

## 🎨 Tech Stack

- **React 18** - UI framework
- **React Router v6** - Navigation
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Lucide React** - Icons
- **Vite** - Build tool

## 📱 Navigation

- **Home Page**: `/` - Choose between Doctor or Patient portal
- **Doctor Portal**: `/doctor` - All doctor features
- **Patient Portal**: `/patient` - All patient features

## 💾 Data

All data is hardcoded in `src/data/dummyData.js` for demonstration purposes:
- Patient information
- Medical transcriptions
- Clinical reports
- Test results
- Medications
- Diet recommendations
- Notifications
- Chatbot FAQs

## 🎯 Demo Flow

1. **Start at Home Page** - Choose Doctor or Patient portal
2. **Doctor Portal**:
   - View dashboard with patient overview
   - Check audio transcription
   - Review clinical report
   - Analyze test trends with charts
   - Get AI diagnostic insights
3. **Patient Portal**:
   - View medication schedule
   - Chat with AI assistant
   - Check diet recommendations
   - Review notifications

## 🏗️ Building for Production

```bash
npm run build
```

The build output will be in the `dist` folder.

## 📝 Notes

- This is a **prototype/demo application** for an Ideathon
- All data is **hardcoded** - no backend required
- All AI features are **simulated** with dummy responses
- Designed to demonstrate UI/UX and workflow concepts

## 👨‍⚕️ Sample Patient Data

**Patient**: Rajesh Sharma (58 years, Male)
**Doctor**: Dr. Priya Mehta (Cardiology)
**Condition**: Cardiovascular concerns with hypertension
**Access Code**: RS58MH

## 🎨 Color Scheme

- Primary: Blue (#0ea5e9)
- Success: Green (#10b981)
- Warning: Yellow/Orange
- Error: Red (#ef4444)
- Doctor Portal: Blue theme
- Patient Portal: Green theme

## 📄 License

This is a prototype project for demonstration purposes.

---

Built with ❤️ for Inter-IIIT Ideathon Round 2

