// Dummy data for the prototype

export const transcriptionData = {
  audio: "doctor_patient_conversation.mp3",
  duration: "5:32",
  transcription: `Doctor: Good morning, Mr. Sharma. How are you feeling today?

Patient: Good morning, Doctor. I've been experiencing chest pain and shortness of breath for the past week.

Doctor: I see. Can you describe the chest pain? Is it sharp or dull?

Patient: It's more of a dull, heavy feeling. It gets worse when I climb stairs.

Doctor: Have you experienced any other symptoms? Dizziness, nausea, or fatigue?

Patient: Yes, I've been feeling quite tired lately, even after resting.

Doctor: I understand. Let's run some tests. I'll order a blood test, ECG, and chest X-ray. In the meantime, try to avoid strenuous activities.

Patient: Okay, Doctor. Should I be worried?

Doctor: Let's wait for the test results first. We'll have a clearer picture then. I'm also prescribing some medication to help with the symptoms.`,
  timestamp: "2025-11-01 09:30 AM"
};

export const doctorNotes = `Patient Observations:
- 58-year-old male presenting with chest pain and dyspnea
- Symptoms worsening with exertion
- History of hypertension (5 years)
- Non-smoker, occasional alcohol consumption
- BMI: 28.5 (overweight)

Physical Examination:
- BP: 145/92 mmHg
- Heart rate: 88 bpm
- Respiratory rate: 18/min
- Temperature: 98.6°F

Clinical Impression:
- Possible angina pectoris
- Rule out coronary artery disease
- Monitor for cardiac markers

Recommended Tests:
- Complete Blood Count
- Lipid Profile
- Troponin levels
- ECG
- Chest X-ray
- Possible stress test`;

export const clinicalReport = `CLINICAL REPORT

Patient Name: Rajesh Sharma
Age: 58 years | Gender: Male
Date: November 1, 2025
Doctor: Dr. Priya Mehta (MD, Cardiology)

CHIEF COMPLAINT:
Chest pain and shortness of breath for 1 week, exacerbated by physical activity.

HISTORY OF PRESENT ILLNESS:
Mr. Sharma reports onset of substernal chest discomfort approximately one week ago. Describes sensation as "heavy" and "dull." Pain radiates to left arm. Associated with dyspnea on exertion. Denies acute onset, but notes progressive worsening with climbing stairs or walking >100 meters.

PAST MEDICAL HISTORY:
- Hypertension (diagnosed 2020, controlled with medication)
- No history of diabetes mellitus
- No prior cardiac events

MEDICATIONS:
- Amlodipine 5mg once daily
- Aspirin 75mg once daily

VITAL SIGNS:
- Blood Pressure: 145/92 mmHg
- Heart Rate: 88 bpm (regular)
- Respiratory Rate: 18 breaths/min
- Temperature: 98.6°F
- SpO2: 96% on room air

PHYSICAL EXAMINATION:
- Cardiovascular: S1, S2 normal. No murmurs appreciated.
- Respiratory: Clear bilateral air entry, no wheeze/crackles
- Abdomen: Soft, non-tender
- Extremities: No edema, peripheral pulses palpable

ASSESSMENT:
Suspected stable angina pectoris. Differential includes coronary artery disease, possible myocardial ischemia.

PLAN:
1. Laboratory investigations ordered
2. ECG and cardiac monitoring
3. Medication adjustments pending test results
4. Follow-up in 3 days or earlier if symptoms worsen
5. Patient education on warning signs (STEMI symptoms)`;

export const testResults = [
  {
    date: "2025-10-15",
    WBC: 7.2,
    RBC: 4.8,
    HB: 13.5,
    Platelets: 250,
    Glucose: 105,
    Cholesterol: 220,
    Triglycerides: 180
  },
  {
    date: "2025-08-20",
    WBC: 7.5,
    RBC: 4.9,
    HB: 13.8,
    Platelets: 245,
    Glucose: 98,
    Cholesterol: 215,
    Triglycerides: 175
  },
  {
    date: "2025-06-10",
    WBC: 7.8,
    RBC: 5.0,
    HB: 14.0,
    Platelets: 240,
    Glucose: 95,
    Cholesterol: 210,
    Triglycerides: 170
  },
  {
    date: "2025-04-05",
    WBC: 8.0,
    RBC: 5.1,
    HB: 14.2,
    Platelets: 235,
    Glucose: 92,
    Cholesterol: 205,
    Triglycerides: 165
  },
  {
    date: "2025-02-15",
    WBC: 7.9,
    RBC: 5.0,
    HB: 14.1,
    Platelets: 238,
    Glucose: 90,
    Cholesterol: 200,
    Triglycerides: 160
  }
];

export const diagnosticInsights = {
  summary: "Based on comprehensive analysis of patient data, conversation, clinical notes, and test results, the following insights have been generated:",
  keyFindings: [
    {
      category: "Cardiovascular Risk",
      severity: "high",
      finding: "Patient presents with classic symptoms of stable angina. Elevated blood pressure (145/92) and borderline high cholesterol (220 mg/dL) indicate increased cardiovascular risk."
    },
    {
      category: "Metabolic Profile",
      severity: "moderate",
      finding: "Fasting glucose levels trending upward (90→105 mg/dL over 8 months). Patient approaching pre-diabetic range. Recommend glucose tolerance test."
    },
    {
      category: "Blood Parameters",
      severity: "low",
      finding: "Complete blood count within normal limits. Slight decrease in hemoglobin (14.2→13.5 g/dL) over 8 months. Monitor for anemia."
    },
    {
      category: "Lipid Profile",
      severity: "high",
      finding: "Total cholesterol elevated and trending upward (200→220 mg/dL). Triglycerides borderline high (180 mg/dL). Recommend statins and lifestyle modifications."
    }
  ],
  recommendations: [
    "Immediate: Order cardiac enzymes (Troponin I/T), ECG, and consider stress test",
    "Short-term: Initiate statin therapy, adjust antihypertensive medication",
    "Long-term: Lifestyle modifications - diet, exercise, weight management",
    "Follow-up: Cardiology consultation within 1 week",
    "Monitoring: Regular BP checks, lipid panel in 6 weeks"
  ],
  differentialDiagnosis: [
    "Stable Angina Pectoris (Primary consideration)",
    "Coronary Artery Disease",
    "Hypertensive Heart Disease",
    "Myocardial Ischemia (rule out)"
  ]
};

export const medications = [
  {
    id: 1,
    name: "Amlodipine",
    dosage: "5mg",
    frequency: "Once daily",
    timing: "Morning (8:00 AM)",
    duration: "Ongoing",
    instructions: "Take with or without food. Do not skip doses.",
    purpose: "Blood pressure control"
  },
  {
    id: 2,
    name: "Aspirin",
    dosage: "75mg",
    frequency: "Once daily",
    timing: "Night (9:00 PM)",
    duration: "Ongoing",
    instructions: "Take after dinner. Do not take on empty stomach.",
    purpose: "Blood thinner, prevents clots"
  },
  {
    id: 3,
    name: "Atorvastatin",
    dosage: "20mg",
    frequency: "Once daily",
    timing: "Night (9:00 PM)",
    duration: "3 months (then review)",
    instructions: "Take at bedtime. Avoid grapefruit juice.",
    purpose: "Cholesterol management"
  },
  {
    id: 4,
    name: "Metoprolol",
    dosage: "25mg",
    frequency: "Twice daily",
    timing: "Morning (8:00 AM) & Evening (6:00 PM)",
    duration: "2 months (then review)",
    instructions: "Take with food. Do not stop suddenly.",
    purpose: "Heart rate and blood pressure control"
  }
];

export const dietRecommendations = {
  general: "Heart-healthy diet recommended for managing cardiovascular risk factors.",
  recommended: [
    "Leafy green vegetables (spinach, kale, lettuce)",
    "Whole grains (brown rice, oats, quinoa)",
    "Fatty fish (salmon, mackerel, sardines) - 2-3 times per week",
    "Nuts and seeds (almonds, walnuts, chia seeds)",
    "Fresh fruits (berries, apples, citrus fruits)",
    "Legumes (lentils, chickpeas, beans)",
    "Low-fat dairy products",
    "Olive oil for cooking"
  ],
  avoid: [
    "Deep-fried foods",
    "Processed meats (sausages, bacon)",
    "High-sodium foods (pickles, papad, packaged snacks)",
    "Sugary beverages and desserts",
    "Trans fats and hydrogenated oils",
    "Excessive red meat",
    "Full-fat dairy products",
    "Refined carbohydrates (white bread, pasta)"
  ],
  tips: [
    "Limit salt intake to less than 5g per day",
    "Drink 8-10 glasses of water daily",
    "Eat smaller, more frequent meals",
    "Avoid heavy meals before bedtime",
    "Include fiber-rich foods in every meal"
  ]
};

export const chatbotFAQs = [
  {
    question: "When do I take my medicine?",
    answer: "You have medications at different times:\n• Morning (8:00 AM): Amlodipine 5mg\n• Evening (6:00 PM): Metoprolol 25mg\n• Night (9:00 PM): Aspirin 75mg and Atorvastatin 20mg\n\nI'll send you reminders before each dose!"
  },
  {
    question: "What diet should I follow?",
    answer: "You should follow a heart-healthy diet. Focus on:\n• Lots of vegetables and fruits\n• Whole grains like brown rice and oats\n• Fish 2-3 times a week\n• Nuts and seeds\n\nAvoid fried foods, processed meats, and excessive salt. Your detailed diet plan is available in the Diet section."
  },
  {
    question: "What does my prescription mean?",
    answer: "Your prescription includes 4 medications:\n1. Amlodipine - controls blood pressure\n2. Aspirin - prevents blood clots\n3. Atorvastatin - manages cholesterol\n4. Metoprolol - controls heart rate and BP\n\nAll medications are important for your heart health. Never skip or stop them without consulting your doctor."
  },
  {
    question: "When is my next appointment?",
    answer: "Your next follow-up appointment is scheduled for November 8, 2025 at 10:00 AM with Dr. Priya Mehta. Please bring your medication list and any questions you have."
  },
  {
    question: "Are there any side effects I should watch for?",
    answer: "Common side effects to watch for:\n• Dizziness (especially when standing up)\n• Unusual tiredness\n• Swelling in ankles or feet\n• Slow or irregular heartbeat\n\nIf you experience chest pain, severe dizziness, or difficulty breathing, seek immediate medical attention."
  }
];

export const notifications = [
  {
    id: 1,
    type: "medication",
    title: "Medication Reminder",
    message: "Time to take Amlodipine 5mg",
    time: "8:00 AM",
    date: "2025-11-01",
    read: false
  },
  {
    id: 2,
    type: "appointment",
    title: "Upcoming Appointment",
    message: "Appointment with Dr. Priya Mehta on Nov 8 at 10:00 AM",
    time: "9:00 AM",
    date: "2025-11-01",
    read: false
  },
  {
    id: 3,
    type: "test",
    title: "Test Results Available",
    message: "Your blood test results from Oct 15 are now available",
    time: "2:30 PM",
    date: "2025-10-31",
    read: true
  },
  {
    id: 4,
    type: "medication",
    title: "Medication Reminder",
    message: "Time to take Metoprolol 25mg",
    time: "6:00 PM",
    date: "2025-11-01",
    read: false
  },
  {
    id: 5,
    type: "general",
    title: "Health Tip",
    message: "Remember to take a 30-minute walk today for better heart health",
    time: "7:00 AM",
    date: "2025-11-01",
    read: true
  }
];

export const patientInfo = {
  name: "Rajesh Sharma",
  age: 58,
  gender: "Male",
  id: "PAT-2025-001234",
  accessCode: "RS58MH",
  doctor: "Dr. Priya Mehta",
  nextAppointment: "November 8, 2025 - 10:00 AM"
};

