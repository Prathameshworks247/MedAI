// Flexible appointment-based data structure

export const patients = [
  {
    id: "PAT-2025-001234",
    name: "Rajesh Sharma",
    age: 58,
    gender: "Male",
    bloodGroup: "B+",
    phone: "+91 98765 43210",
    email: "rajesh.sharma@email.com",
    registeredDate: "2025-01-15",
    totalAppointments: 3,
    lastVisit: "2025-11-01"
  },
  {
    id: "PAT-2025-001235",
    name: "Priya Verma",
    age: 34,
    gender: "Female",
    bloodGroup: "O+",
    phone: "+91 98765 43211",
    email: "priya.verma@email.com",
    registeredDate: "2025-10-28",
    totalAppointments: 1,
    lastVisit: null
  },
  {
    id: "PAT-2025-001236",
    name: "Amit Kumar",
    age: 45,
    gender: "Male",
    bloodGroup: "A+",
    phone: "+91 98765 43212",
    email: "amit.kumar@email.com",
    registeredDate: "2025-09-15",
    totalAppointments: 2,
    lastVisit: "2025-10-20"
  }
];

// Activity types
export const ACTIVITY_TYPES = {
  RECORDING: 'recording',
  DOCUMENTS: 'documents',
  REPORT: 'report',
  TESTS: 'tests',
  DIAGNOSIS: 'diagnosis',
  ADDITIONAL_DOCS: 'additional_docs'
};

export const appointments = [
  // Rajesh Sharma's appointments
  {
    id: "6969dd6a7440577e45866c9e",
    appointmentNumber: 3,
    patientId: "PAT-2025-001234",
    patientName: "Rajesh Sharma",
    patientAge: 58,
    patientGender: "Male",
    scheduledDate: "2025-11-01",
    scheduledTime: "10:00 AM",
    endTime: "11:00 AM",
    type: "CONTINUATION",
    status: "IN_PROGRESS",
    chiefComplaint: "Chest pain follow-up, review test results",
    previousAppointments: ["APT-2025-00122", "APT-2025-00121"],
    
    session: {
      startedAt: "2025-11-01 10:05 AM",
      pausedAt: null,
      endedAt: null,
      totalDuration: "25:30",
      
      // Chronological activity timeline
      activities: [
        {
          id: "ACT001",
          type: ACTIVITY_TYPES.RECORDING,
          timestamp: "2025-11-01 10:05 AM",
          status: "COMPLETED",
          title: "Consultation Recording",
          data: {
            audioFile: "recording_apt123.mp3",
            duration: "05:32",
            transcription: `Doctor: Good morning, Mr. Sharma. How have you been feeling since our last visit?

Patient: Good morning, Doctor. The chest pain has reduced, but I still feel it occasionally when I climb stairs.

Doctor: I see. Have you been taking your medications regularly?

Patient: Yes, Doctor. I take Amlodipine in the morning and Atorvastatin at night, as prescribed.

Doctor: That's good. Your blood pressure seems better today at 138/88. Let's review your test results from last week.

Patient: Sure, Doctor.

Doctor: Your cholesterol has improved from 220 to 205, which is positive. However, I see your blood sugar is at 105, slightly elevated. We need to watch that.

Patient: Should I be worried, Doctor?

Doctor: Not immediately, but we should modify your diet and monitor it. I'll also adjust your medication slightly.

Patient: Okay, Doctor. What changes do you recommend?

Doctor: Continue current medications. I'm adding Metoprolol 25mg twice daily for better heart rate control. Also, follow a strict low-sugar, low-salt diet.

Patient: Understood, Doctor. When should I come back?

Doctor: Let's schedule a follow-up in two weeks. If you experience severe chest pain or breathlessness, contact me immediately.

Patient: Thank you, Doctor.`
          }
        },
        {
          id: "ACT002",
          type: ACTIVITY_TYPES.DOCUMENTS,
          timestamp: "2025-11-01 10:15 AM",
          status: "COMPLETED",
          title: "Handwritten Notes Uploaded",
          data: {
            files: [
              { 
                id: "DOC001",
                name: "clinical_notes_page1.jpg", 
                uploadedAt: "2025-11-01 10:15 AM",
                size: "2.3 MB"
              },
              { 
                id: "DOC002",
                name: "clinical_notes_page2.jpg", 
                uploadedAt: "2025-11-01 10:15 AM",
                size: "2.1 MB"
              }
            ],
            ocrExtracted: "BP: 138/88 mmHg, HR: 82 bpm, Temp: 98.6°F\nChest pain: Occasional, on exertion\nMedication compliance: Good\nPhysical examination: Normal heart sounds, clear lungs"
          }
        },
        {
          id: "ACT003",
          type: ACTIVITY_TYPES.REPORT,
          timestamp: "2025-11-01 10:22 AM",
          status: "COMPLETED",
          title: "Clinical Report Generated",
          data: {
            content: `CLINICAL REPORT - Appointment #3

Date: November 1, 2025
Time: 10:00 AM - 11:00 AM
Doctor: Dr. Priya Mehta, MD (Cardiology)
Patient: Rajesh Sharma, 58 years, Male

SUBJECTIVE:
Patient reports improvement in chest pain since last visit. Still experiences occasional discomfort with exertion, particularly when climbing stairs. Denies radiating pain, nausea, or acute episodes. Medication compliance is good. No new symptoms reported.

OBJECTIVE:
Vital Signs:
- Blood Pressure: 138/88 mmHg (improved from 145/92)
- Heart Rate: 82 bpm (regular)
- Respiratory Rate: 18 breaths/min
- Temperature: 98.6°F
- SpO2: 97% on room air

Physical Examination:
- Cardiovascular: S1, S2 normal, no murmurs, no gallop
- Respiratory: Clear bilateral air entry, no adventitious sounds
- Abdomen: Soft, non-tender, no organomegaly
- Extremities: No edema, peripheral pulses normal

Recent Lab Results (reviewed):
- Total Cholesterol: 205 mg/dL (down from 220)
- LDL: 140 mg/dL
- HDL: 38 mg/dL
- Triglycerides: 175 mg/dL
- Fasting Glucose: 105 mg/dL (elevated)

ASSESSMENT:
1. Stable angina pectoris - improved with current therapy
2. Hypertension - better controlled
3. Hyperlipidemia - showing improvement
4. Impaired fasting glucose - requires monitoring

PLAN:
1. Continue Amlodipine 5mg once daily
2. Continue Atorvastatin 20mg at bedtime
3. ADD: Metoprolol 25mg twice daily for rate control
4. Dietary modifications: Low-sugar, low-salt diet
5. Regular exercise as tolerated (avoid strenuous activity)
6. Monitor fasting glucose - consider glucose tolerance test if remains elevated
7. Follow-up in 2 weeks
8. Emergency instructions provided

Dr. Priya Mehta, MD
Cardiology Department
City Heart Hospital`
          }
        }
      ],
      
      // Required activities completion status
      requiredCompleted: {
        recording: true,
        documents: true,
        report: true
      }
    }
  },
  
  {
    id: "APT-2025-00122",
    appointmentNumber: 2,
    patientId: "PAT-2025-001234",
    patientName: "Rajesh Sharma",
    patientAge: 58,
    patientGender: "Male",
    scheduledDate: "2025-10-15",
    scheduledTime: "2:00 PM",
    endTime: "3:00 PM",
    type: "CONTINUATION",
    status: "COMPLETED",
    chiefComplaint: "Chest pain, shortness of breath - test results review",
    previousAppointments: ["APT-2025-00121"],
    
    session: {
      startedAt: "2025-10-15 2:05 PM",
      endedAt: "2025-10-15 2:52 PM",
      totalDuration: "47:00",
      
      activities: [
        {
          id: "ACT201",
          type: ACTIVITY_TYPES.RECORDING,
          timestamp: "2025-10-15 2:05 PM",
          status: "COMPLETED",
          title: "Consultation Recording",
          data: {
            duration: "12:30",
            transcription: "Full consultation transcription..."
          }
        },
        {
          id: "ACT202",
          type: ACTIVITY_TYPES.DOCUMENTS,
          timestamp: "2025-10-15 2:20 PM",
          status: "COMPLETED",
          title: "Handwritten Notes Uploaded",
          data: {
            files: [
              { name: "notes_oct15_page1.jpg" },
              { name: "notes_oct15_page2.jpg" }
            ]
          }
        },
        {
          id: "ACT203",
          type: ACTIVITY_TYPES.REPORT,
          timestamp: "2025-10-15 2:25 PM",
          status: "COMPLETED",
          title: "Clinical Report Generated",
          data: {
            content: `CLINICAL REPORT - Appointment #2

SUBJECTIVE:
Patient reports persistent chest pain, worse with exertion. Dyspnea on climbing stairs. No radiating pain to arms or jaw. No nausea or dizziness.

OBJECTIVE:
BP: 145/92 mmHg, HR: 88 bpm, RR: 18/min, Temp: 98.6°F
CVS: S1, S2 normal, no murmurs
Respiratory: Clear bilateral air entry

ASSESSMENT:
1. Suspected stable angina pectoris
2. Hypertension - suboptimal control
3. Hyperlipidemia

PLAN:
1. Continue Amlodipine 5mg OD
2. Start Atorvastatin 20mg HS
3. Aspirin 75mg HS
4. Low-salt, low-fat diet
5. Tests ordered - follow-up with results
6. Cardiac stress test if symptoms persist`
          }
        },
        {
          id: "ACT204",
          type: ACTIVITY_TYPES.TESTS,
          timestamp: "2025-10-15 2:35 PM",
          status: "COMPLETED",
          title: "Test Results Uploaded",
          data: {
            files: [
              { name: "blood_test_oct15.pdf", type: "Blood Work" },
              { name: "ecg_oct15.jpg", type: "ECG" }
            ],
            extractedValues: {
              WBC: 7.2,
              RBC: 4.8,
              HB: 13.5,
              Platelets: 250,
              Glucose: 105,
              Cholesterol: 220,
              Triglycerides: 180,
              HDL: 38,
              LDL: 145
            }
          }
        },
        {
          id: "ACT205",
          type: ACTIVITY_TYPES.DIAGNOSIS,
          timestamp: "2025-10-15 2:45 PM",
          status: "COMPLETED",
          title: "Diagnosis & Insights Generated",
          data: {
            diagnosis: "Stable Angina Pectoris with Hypertension and Hyperlipidemia",
            riskLevel: "MODERATE",
            findings: [
              "Elevated cholesterol trending upward (215 → 220 mg/dL)",
              "Blood glucose in pre-diabetic range (105 mg/dL)",
              "Blood pressure not at target (<130/80)",
              "Hemoglobin slightly decreased (14.2 → 13.5 g/dL)"
            ],
            recommendations: [
              "Continue medication as prescribed",
              "Strict dietary modifications - low salt, low sugar, low fat",
              "Regular cardiovascular exercise as tolerated",
              "Monitor blood glucose - consider HbA1c test",
              "Follow-up in 2-3 weeks",
              "Immediate contact if chest pain worsens"
            ],
            comparisonData: {
              prevVisit: "2025-10-01",
              changes: {
                cholesterol: "+5 mg/dL",
                glucose: "+7 mg/dL",
                bp: "Stable"
              }
            }
          }
        }
      ],
      
      requiredCompleted: {
        recording: true,
        documents: true,
        report: true
      }
    }
  },
  
  {
    id: "APT-2025-00121",
    appointmentNumber: 1,
    patientId: "PAT-2025-001234",
    patientName: "Rajesh Sharma",
    patientAge: 58,
    patientGender: "Male",
    scheduledDate: "2025-10-01",
    scheduledTime: "11:00 AM",
    endTime: "12:00 PM",
    type: "NEW_PATIENT",
    status: "COMPLETED",
    chiefComplaint: "Chest pain and shortness of breath - first consultation",
    previousAppointments: [],
    
    session: {
      startedAt: "2025-10-01 11:05 AM",
      endedAt: "2025-10-01 11:58 AM",
      totalDuration: "53:00",
      
      activities: [
        {
          id: "ACT101",
          type: ACTIVITY_TYPES.RECORDING,
          timestamp: "2025-10-01 11:05 AM",
          status: "COMPLETED",
          title: "Initial Consultation Recording",
          data: {
            duration: "15:20",
            transcription: "Initial consultation transcription..."
          }
        },
        {
          id: "ACT102",
          type: ACTIVITY_TYPES.DOCUMENTS,
          timestamp: "2025-10-01 11:25 AM",
          status: "COMPLETED",
          title: "Initial Clinical Notes",
          data: {
            files: [{ name: "initial_notes.jpg" }]
          }
        },
        {
          id: "ACT103",
          type: ACTIVITY_TYPES.REPORT,
          timestamp: "2025-10-01 11:35 AM",
          status: "COMPLETED",
          title: "Initial Clinical Report",
          data: {
            content: "Initial consultation report..."
          }
        },
        {
          id: "ACT104",
          type: ACTIVITY_TYPES.TESTS,
          timestamp: "2025-10-01 11:40 AM",
          status: "COMPLETED",
          title: "Baseline Test Results",
          data: {
            files: [{ name: "baseline_blood_work.pdf" }],
            extractedValues: {
              WBC: 7.5,
              RBC: 4.9,
              HB: 13.8,
              Platelets: 245,
              Glucose: 98,
              Cholesterol: 215,
              Triglycerides: 175
            }
          }
        },
        {
          id: "ACT105",
          type: ACTIVITY_TYPES.DIAGNOSIS,
          timestamp: "2025-10-01 11:50 AM",
          status: "COMPLETED",
          title: "Initial Diagnosis",
          data: {
            diagnosis: "Suspected Stable Angina Pectoris with Cardiovascular Risk Factors",
            riskLevel: "MODERATE",
            findings: ["Initial cardiovascular risk assessment completed"],
            recommendations: [
              "Start Amlodipine for blood pressure control",
              "Lifestyle modifications recommended",
              "Follow-up in 2 weeks with test results"
            ]
          }
        }
      ],
      
      requiredCompleted: {
        recording: true,
        documents: true,
        report: true
      }
    }
  },
  
  // Today's other appointments
  {
    id: "APT-2025-00120",
    appointmentNumber: 1,
    patientId: "PAT-2025-001237",
    patientName: "Ramesh Gupta",
    patientAge: 52,
    patientGender: "Male",
    scheduledDate: "2025-11-01",
    scheduledTime: "9:00 AM",
    endTime: "10:00 AM",
    type: "CONTINUATION",
    status: "COMPLETED",
    chiefComplaint: "Diabetes follow-up",
    previousAppointments: [],
    session: {
      startedAt: "2025-11-01 9:05 AM",
      endedAt: "2025-11-01 9:45 AM",
      totalDuration: "40:00",
      activities: [],
      requiredCompleted: { recording: true, documents: true, report: true }
    }
  },
  
  {
    id: "APT-2025-00124",
    appointmentNumber: 1,
    patientId: "PAT-2025-001235",
    patientName: "Priya Verma",
    patientAge: 34,
    patientGender: "Female",
    scheduledDate: "2025-11-01",
    scheduledTime: "11:30 AM",
    endTime: "12:30 PM",
    type: "NEW_PATIENT",
    status: "SCHEDULED",
    chiefComplaint: "General health checkup, family history of hypertension",
    previousAppointments: []
  },
  
  {
    id: "APT-2025-00125",
    appointmentNumber: 2,
    patientId: "PAT-2025-001236",
    patientName: "Amit Kumar",
    patientAge: 45,
    patientGender: "Male",
    scheduledDate: "2025-11-01",
    scheduledTime: "2:00 PM",
    endTime: "3:00 PM",
    type: "CONTINUATION",
    status: "SCHEDULED",
    chiefComplaint: "Blood pressure review, medication adjustment",
    previousAppointments: ["APT-2025-00118"]
  },
  
  {
    id: "APT-2025-00126",
    appointmentNumber: 1,
    patientId: "PAT-2025-001238",
    patientName: "Sunita Devi",
    patientAge: 62,
    patientGender: "Female",
    scheduledDate: "2025-11-01",
    scheduledTime: "4:00 PM",
    endTime: "5:00 PM",
    type: "NEW_PATIENT",
    status: "SCHEDULED",
    chiefComplaint: "Joint pain and fatigue",
    previousAppointments: []
  }
];

export const todaysSchedule = {
  date: "2025-11-01",
  dayOfWeek: "Friday",
  appointments: appointments.filter(apt => apt.scheduledDate === "2025-11-01")
};

// Helper functions
export const getCurrentAppointment = () => {
  return appointments.find(apt => apt.status === "IN_PROGRESS");
};

export const getAppointmentsByPatient = (patientId) => {
  return appointments
    .filter(apt => apt.patientId === patientId)
    .sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate));
};

export const getPatientById = (patientId) => {
  return patients.find(p => p.id === patientId);
};

export const isRequiredActivitiesComplete = (session) => {
  return session?.requiredCompleted?.recording && 
         session?.requiredCompleted?.documents && 
         session?.requiredCompleted?.report;
};

export const getActivityIcon = (type) => {
  const icons = {
    [ACTIVITY_TYPES.RECORDING]: '🎤',
    [ACTIVITY_TYPES.DOCUMENTS]: '📄',
    [ACTIVITY_TYPES.REPORT]: '📋',
    [ACTIVITY_TYPES.TESTS]: '🧪',
    [ACTIVITY_TYPES.DIAGNOSIS]: '🩺',
    [ACTIVITY_TYPES.ADDITIONAL_DOCS]: '📎'
  };
  return icons[type] || '📌';
};

export const doctorInfo = {
  name: "Dr. Priya Mehta",
  specialization: "Cardiology",
  qualification: "MD, DM (Cardiology)",
  registrationNo: "MCI-12345",
  hospital: "City Heart Hospital"
};
