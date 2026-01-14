import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  Bot,
  User,
  Sparkles,
  FileText,
  TrendingUp,
  AlertCircle,
  Lightbulb,
} from "lucide-react";
import { appointments } from "../../data/appointmentData";

const ChatWithAI = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const appointment = appointments.find((a) => a.id === appointmentId);

  const [messages, setMessages] = useState([
    {
      type: "bot",
      text: `Hello Dr. Mehta! I'm your AI assistant for ${
        appointment?.patientName
      }'s appointment. I have access to:\n\nPatient consultation recording & transcription [Source: Audio Recording System]\nClinical notes and reports [Source: Clinical Report Database]\nPrevious appointment history (${
        appointment?.previousAppointments?.length || 0
      } visits) [Source: Patient Medical Records]\nTest results and trends [Source: Laboratory Information System]\n\nHow can I help you today?`,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  if (!appointment) {
    return <div className="p-6">Appointment not found</div>;
  }

  const session = appointment.session;
  const hasRecording = session?.activities?.some((a) => a.type === "recording");
  const hasReport = session?.activities?.some((a) => a.type === "report");
  const hasTests = session?.activities?.some((a) => a.type === "tests");
  const hasDiagnosis = session?.activities?.some((a) => a.type === "diagnosis");

  const suggestedQuestions = [
    {
      question: "Summarize the key findings from today's consultation",
      icon: FileText,
      condition: hasRecording,
    },
    {
      question: "What are the main concerns based on the clinical report?",
      icon: AlertCircle,
      condition: hasReport,
    },
    {
      question: "Compare test results with previous appointments",
      icon: TrendingUp,
      condition: hasTests && appointment.previousAppointments?.length > 0,
    },
    {
      question: "Suggest treatment options based on current diagnosis",
      icon: Lightbulb,
      condition: hasDiagnosis,
    },
    {
      question: "What lifestyle modifications should I recommend?",
      icon: Lightbulb,
      condition: true,
    },
    {
      question: "Are there any medication interactions I should consider?",
      icon: AlertCircle,
      condition: true,
    },
  ].filter((q) => q.condition);

  const handleSend = () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage = {
      type: "user",
      text: input,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const responses = {
        summarize: `Based on today's consultation with ${
          appointment.patientName
        }:

CHIEF COMPLAINT: ${appointment.chiefComplaint} [Source: Patient Consultation Recording]

KEY POINTS:
Patient reports ${
          appointment.type === "CONTINUATION"
            ? "follow-up progress"
            : "initial presentation"
        } [Source: Appointment Type Record]
Age: ${appointment.patientAge} years [Source: Patient Demographics Database]
Gender: ${appointment.patientGender} [Source: Patient Profile]
This is appointment number ${appointment.appointmentNumber} [Source: Appointment History]
${
  appointment.previousAppointments?.length > 0
    ? `Previous visits: ${appointment.previousAppointments.length} [Source: Medical Records Database]`
    : ""
}

CLINICAL FINDINGS:
The consultation reveals important updates that should be documented in the clinical report [Source: Audio Transcription Analysis]. Based on the available data [Source: Current Session Data], I recommend reviewing the test results and considering treatment adjustments.

Would you like me to elaborate on any specific aspect?`,

        concerns: `Main Clinical Concerns for ${appointment.patientName} [Source: Patient Profile]:

1. Primary Issue: ${appointment.chiefComplaint} [Source: Chief Complaint from Consultation Recording]
2. Patient Type: ${
          appointment.type === "NEW_PATIENT"
            ? "New patient requiring baseline assessment [Source: Appointment Type Record]"
            : `Continuation - Visit #${appointment.appointmentNumber} [Source: Appointment History]`
        }
3. Risk Factors: Age ${
          appointment.patientAge
        } years [Source: Patient Demographics Database], requires cardiovascular monitoring [Source: Clinical Guidelines Database]

RECOMMENDATIONS:
Continue monitoring symptoms [Source: Clinical Best Practices]
Review medication compliance [Source: Prescription Records]
Consider lifestyle modifications [Source: Treatment Protocol Database]
Schedule appropriate follow-up [Source: Care Management Guidelines]

Would you like specific treatment recommendations?`,

        compare:
          appointment.previousAppointments?.length > 0
            ? `Comparison with Previous Appointments [Source: Medical Records Database]:

This is appointment number ${appointment.appointmentNumber} for ${
                appointment.patientName
              } [Source: Appointment History].

PREVIOUS VISIT DATA AVAILABLE:
Appointment number ${
                appointment.appointmentNumber - 1
              }: Previous test results on file [Source: Laboratory Information System]
Trends: Can analyze changes in key parameters [Source: Historical Data Analysis]
Progress: ${
                appointment.type === "CONTINUATION"
                  ? "Follow-up care in progress [Source: Appointment Type Record]"
                  : "Initial baseline [Source: Appointment Type Record]"
              }

TREND ANALYSIS:
Based on the timeline [Source: Appointment Timeline Database], I can identify:
Changes in vital signs [Source: Vital Signs Monitoring System]
Medication efficacy [Source: Treatment Response Records]
Symptom progression [Source: Patient Consultation Notes]
Risk factor evolution [Source: Clinical Assessment Database]

Would you like a detailed comparison of specific parameters?`
            : `This is the first appointment for ${appointment.patientName} [Source: Appointment History]. No previous data available for comparison yet [Source: Medical Records Database].`,

        treatment: `TREATMENT RECOMMENDATIONS FOR ${appointment.patientName} [Source: Patient Profile]:

BASED ON CURRENT ASSESSMENT [Source: Clinical Examination Data]:

1. MEDICATION MANAGEMENT
   Review current prescriptions [Source: Prescription Records]
   Consider dosage adjustments based on response [Source: Treatment Response Monitoring]
   Monitor for side effects [Source: Medication Safety Database]

2. LIFESTYLE MODIFICATIONS [Source: Treatment Protocol Database]
   Diet: Heart-healthy, low sodium [Source: Nutritional Guidelines]
   Exercise: Moderate activity as tolerated [Source: Exercise Therapy Recommendations]
   Stress management techniques [Source: Behavioral Health Guidelines]

3. MONITORING [Source: Care Management Guidelines]
   Regular follow-up in 2-4 weeks [Source: Clinical Best Practices]
   Home BP monitoring if applicable [Source: Vital Signs Protocol]
   Symptom diary [Source: Patient Care Guidelines]

4. ADDITIONAL TESTS [Source: Diagnostic Protocol Database]
   Consider if symptoms persist [Source: Clinical Decision Support]
   Baseline labs if not recent [Source: Laboratory Testing Guidelines]

Would you like more specific pharmaceutical recommendations?`,

        lifestyle: `LIFESTYLE MODIFICATION RECOMMENDATIONS FOR ${appointment.patientName} [Source: Patient Profile]:

DIETARY CHANGES [Source: Nutritional Guidelines Database]:
Mediterranean-style diet [Source: Dietary Recommendations]
Reduce sodium intake (<2000mg/day) [Source: Cardiovascular Health Guidelines]
Increase fiber and omega-3 fatty acids [Source: Nutritional Science Evidence]
Limit processed foods and added sugars [Source: Dietary Best Practices]

PHYSICAL ACTIVITY [Source: Exercise Therapy Guidelines]:
30 minutes moderate exercise, 5 days/week [Source: Physical Activity Recommendations]
Start slowly and gradually increase [Source: Exercise Protocol]
Walking, swimming, or cycling recommended [Source: Cardiovascular Exercise Guidelines]
Avoid strenuous activity if chest pain present [Source: Safety Guidelines based on Chief Complaint: ${appointment.chiefComplaint}]

STRESS MANAGEMENT [Source: Behavioral Health Guidelines]:
Adequate sleep (7-8 hours) [Source: Sleep Medicine Guidelines]
Relaxation techniques (meditation, deep breathing) [Source: Stress Management Protocol]
Regular social activities [Source: Mental Health Recommendations]
Consider stress counseling if needed [Source: Behavioral Health Services]

RISK FACTOR MANAGEMENT [Source: Preventive Care Guidelines]:
Smoking cessation if applicable [Source: Tobacco Cessation Protocol]
Limit alcohol consumption [Source: Substance Use Guidelines]
Maintain healthy weight (BMI 18.5-24.9) [Source: Weight Management Guidelines for Age: ${appointment.patientAge} years]

Would you like printed patient education materials?`,

        medication: `MEDICATION INTERACTION REVIEW FOR ${appointment.patientName} [Source: Patient Profile]:

CURRENT CONSIDERATIONS [Source: Medication Safety Database]:
Review complete medication list including OTC drugs [Source: Prescription Records]
Check for drug-drug interactions [Source: Drug Interaction Database]
Consider age-related metabolism changes [Source: Age: ${appointment.patientAge} years from Patient Demographics]
Monitor for polypharmacy risks [Source: Pharmacy Safety Guidelines]

KEY INTERACTIONS TO WATCH [Source: Clinical Pharmacology Database]:
Cardiovascular medications with supplements [Source: Drug Interaction Alerts]
NSAIDs with blood pressure medications [Source: Medication Contraindication Database]
Statins with certain antibiotics [Source: Drug-Drug Interaction Guidelines]
Blood thinners with other medications [Source: Anticoagulation Safety Protocol]

RECOMMENDATIONS [Source: Medication Management Guidelines]:
Use drug interaction checker database [Source: Clinical Decision Support System]
Review medication timing for optimal absorption [Source: Pharmacokinetics Guidelines]
Consider pharmacist consultation for complex regimens [Source: Interdisciplinary Care Protocol]
Patient education on avoiding contraindicated substances [Source: Patient Safety Guidelines]

Would you like me to check specific medication combinations?`,
      };

      // Find matching response based on keywords
      let botResponse =
        "I understand your question. Based on the available patient data for this appointment [Source: Current Session Data], I can help you analyze:\n\nClinical findings and observations [Source: Clinical Report Database]\nTest results and trends [Source: Laboratory Information System]\nTreatment recommendations [Source: Treatment Protocol Database]\nRisk assessment [Source: Clinical Decision Support System]\n\nCould you please be more specific about what aspect you'd like me to focus on?";

      const inputLower = input.toLowerCase();
      if (
        inputLower.includes("summarize") ||
        inputLower.includes("summary") ||
        inputLower.includes("key finding")
      ) {
        botResponse = responses.summarize;
      } else if (
        inputLower.includes("concern") ||
        inputLower.includes("worry") ||
        inputLower.includes("problem")
      ) {
        botResponse = responses.concerns;
      } else if (
        inputLower.includes("compare") ||
        inputLower.includes("previous") ||
        inputLower.includes("trend")
      ) {
        botResponse = responses.compare;
      } else if (
        inputLower.includes("treatment") ||
        inputLower.includes("therapy") ||
        inputLower.includes("manage")
      ) {
        botResponse = responses.treatment;
      } else if (
        inputLower.includes("lifestyle") ||
        inputLower.includes("diet") ||
        inputLower.includes("exercise")
      ) {
        botResponse = responses.lifestyle;
      } else if (
        inputLower.includes("medication") ||
        inputLower.includes("drug") ||
        inputLower.includes("interaction")
      ) {
        botResponse = responses.medication;
      }

      const botMessage = {
        type: "bot",
        text: botResponse,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 2000);
  };

  const handleQuickQuestion = (question) => {
    setInput(question);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(`/doctor/session/${appointmentId}`)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Session
        </button>

        <div className="card bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="bg-blue-600 p-2 rounded-full">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Chat with AI Assistant
                </h2>
              </div>
              <p className="text-gray-700 mb-2">
                <span className="font-semibold">Patient:</span>{" "}
                {appointment.patientName} •
                <span className="ml-2">
                  Appointment #{appointment.appointmentNumber}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                AI has context of all session activities and can help with
                clinical decisions
              </p>
            </div>
            <div className="bg-blue-600 px-4 py-2 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Available Context */}
      <div className="card mb-6 bg-gray-50">
        <h3 className="text-sm font-bold text-gray-900 mb-3">
          AI Context Available:
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div
            className={`p-3 rounded-lg border-2 ${
              hasRecording
                ? "bg-green-50 border-green-300"
                : "bg-gray-100 border-gray-200"
            }`}
          >
            <div className="flex items-center space-x-2">
              {hasRecording ? (
                <Sparkles className="w-4 h-4 text-green-600" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-gray-300"></div>
              )}
              <span className="text-xs font-semibold text-gray-900">
                Recording
              </span>
            </div>
          </div>
          <div
            className={`p-3 rounded-lg border-2 ${
              hasReport
                ? "bg-green-50 border-green-300"
                : "bg-gray-100 border-gray-200"
            }`}
          >
            <div className="flex items-center space-x-2">
              {hasReport ? (
                <Sparkles className="w-4 h-4 text-green-600" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-gray-300"></div>
              )}
              <span className="text-xs font-semibold text-gray-900">
                Clinical Report
              </span>
            </div>
          </div>
          <div
            className={`p-3 rounded-lg border-2 ${
              hasTests
                ? "bg-green-50 border-green-300"
                : "bg-gray-100 border-gray-200"
            }`}
          >
            <div className="flex items-center space-x-2">
              {hasTests ? (
                <Sparkles className="w-4 h-4 text-green-600" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-gray-300"></div>
              )}
              <span className="text-xs font-semibold text-gray-900">
                Test Results
              </span>
            </div>
          </div>
          <div
            className={`p-3 rounded-lg border-2 ${
              appointment.previousAppointments?.length > 0
                ? "bg-green-50 border-green-300"
                : "bg-gray-100 border-gray-200"
            }`}
          >
            <div className="flex items-center space-x-2">
              {appointment.previousAppointments?.length > 0 ? (
                <Sparkles className="w-4 h-4 text-green-600" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-gray-300"></div>
              )}
              <span className="text-xs font-semibold text-gray-900">
                History
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="card">
        {/* Messages Area */}
        <div className="h-[500px] overflow-y-auto p-4 space-y-4 bg-gray-50 rounded-lg mb-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start space-x-3 ${
                message.type === "user"
                  ? "flex-row-reverse space-x-reverse"
                  : ""
              }`}
            >
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  message.type === "bot" ? "bg-blue-600" : "bg-green-600"
                }`}
              >
                {message.type === "bot" ? (
                  <Bot className="w-6 h-6 text-white" />
                ) : (
                  <User className="w-6 h-6 text-white" />
                )}
              </div>
              <div
                className={`flex-1 ${
                  message.type === "user" ? "items-end" : ""
                }`}
              >
                <div
                  className={`inline-block max-w-[85%] p-4 rounded-lg ${
                    message.type === "bot"
                      ? "bg-white border border-gray-200 text-gray-900"
                      : "bg-green-600 text-white"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {message.text}
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-1">{message.time}</p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div className="bg-white border border-gray-200 p-4 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div>
          <div className="flex space-x-2 mb-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask me anything about this appointment..."
              className="flex-1 input-field"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors flex items-center ${
                input.trim()
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Send className="w-4 h-4 mr-2" />
              Send
            </button>
          </div>

          {/* Suggested Questions */}
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-2">
              Suggested Questions:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickQuestion(item.question)}
                  className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg border border-blue-200 transition-colors flex items-center space-x-1"
                >
                  <item.icon className="w-3 h-3" />
                  <span>{item.question}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="card mt-6 bg-yellow-50 border-2 border-yellow-200">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-yellow-900 mb-1">
              AI Assistant Capabilities
            </h4>
            <p className="text-sm text-yellow-800 leading-relaxed">
              This AI assistant has been trained on medical literature and has
              access to all appointment data. It can help with clinical decision
              support, but final decisions should always be made by the
              physician. Use this tool to explore treatment options, understand
              test results, and get second opinions on diagnosis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWithAI;
