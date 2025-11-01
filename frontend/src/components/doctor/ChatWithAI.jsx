import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Bot, User, Sparkles, FileText, TrendingUp, AlertCircle, Lightbulb } from 'lucide-react';
import { appointments } from '../../data/appointmentData';

const ChatWithAI = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const appointment = appointments.find(a => a.id === appointmentId);
  
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: `Hello Dr. Mehta! I'm your AI assistant for ${appointment?.patientName}'s appointment. I have access to:\n\n• Patient consultation recording & transcription\n• Clinical notes and reports\n• Previous appointment history (${appointment?.previousAppointments?.length || 0} visits)\n• Test results and trends\n\nHow can I help you today?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  if (!appointment) {
    return <div className="p-6">Appointment not found</div>;
  }

  const session = appointment.session;
  const hasRecording = session?.activities?.some(a => a.type === 'recording');
  const hasReport = session?.activities?.some(a => a.type === 'report');
  const hasTests = session?.activities?.some(a => a.type === 'tests');
  const hasDiagnosis = session?.activities?.some(a => a.type === 'diagnosis');

  const suggestedQuestions = [
    {
      question: "Summarize the key findings from today's consultation",
      icon: FileText,
      condition: hasRecording
    },
    {
      question: "What are the main concerns based on the clinical report?",
      icon: AlertCircle,
      condition: hasReport
    },
    {
      question: "Compare test results with previous appointments",
      icon: TrendingUp,
      condition: hasTests && appointment.previousAppointments?.length > 0
    },
    {
      question: "Suggest treatment options based on current diagnosis",
      icon: Lightbulb,
      condition: hasDiagnosis
    },
    {
      question: "What lifestyle modifications should I recommend?",
      icon: Lightbulb,
      condition: true
    },
    {
      question: "Are there any medication interactions I should consider?",
      icon: AlertCircle,
      condition: true
    }
  ].filter(q => q.condition);

  const handleSend = () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage = {
      type: 'user',
      text: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const responses = {
        'summarize': `Based on today's consultation with ${appointment.patientName}:

**Chief Complaint:** ${appointment.chiefComplaint}

**Key Points:**
• Patient reports ${appointment.type === 'CONTINUATION' ? 'follow-up progress' : 'initial presentation'} 
• ${appointment.patientAge} year old ${appointment.patientGender}
• This is appointment #${appointment.appointmentNumber}
${appointment.previousAppointments?.length > 0 ? `• Previous visits: ${appointment.previousAppointments.length}` : ''}

**Clinical Findings:**
The consultation reveals important updates that should be documented in the clinical report. Based on the available data, I recommend reviewing the test results and considering treatment adjustments.

Would you like me to elaborate on any specific aspect?`,
        
        'concerns': `**Main Clinical Concerns for ${appointment.patientName}:**

1. **Primary Issue:** ${appointment.chiefComplaint}
2. **Patient Type:** ${appointment.type === 'NEW_PATIENT' ? 'New patient requiring baseline assessment' : `Continuation - Visit #${appointment.appointmentNumber}`}
3. **Risk Factors:** Age ${appointment.patientAge}, requires cardiovascular monitoring

**Recommendations:**
• Continue monitoring symptoms
• Review medication compliance
• Consider lifestyle modifications
• Schedule appropriate follow-up

Would you like specific treatment recommendations?`,

        'compare': appointment.previousAppointments?.length > 0 ? `**Comparison with Previous Appointments:**

This is appointment #${appointment.appointmentNumber} for ${appointment.patientName}.

**Previous Visit Data Available:**
• Appointment #${appointment.appointmentNumber - 1}: Previous test results on file
• Trends: Can analyze changes in key parameters
• Progress: ${appointment.type === 'CONTINUATION' ? 'Follow-up care in progress' : 'Initial baseline'}

**Trend Analysis:**
Based on the timeline, I can identify:
• Changes in vital signs
• Medication efficacy
• Symptom progression
• Risk factor evolution

Would you like a detailed comparison of specific parameters?` : `This is the first appointment for ${appointment.patientName}. No previous data available for comparison yet.`,

        'treatment': `**Treatment Recommendations for ${appointment.patientName}:**

**Based on Current Assessment:**
1. **Medication Management**
   - Review current prescriptions
   - Consider dosage adjustments based on response
   - Monitor for side effects

2. **Lifestyle Modifications**
   - Diet: Heart-healthy, low sodium
   - Exercise: Moderate activity as tolerated
   - Stress management techniques

3. **Monitoring**
   - Regular follow-up in 2-4 weeks
   - Home BP monitoring if applicable
   - Symptom diary

4. **Additional Tests**
   - Consider if symptoms persist
   - Baseline labs if not recent

Would you like more specific pharmaceutical recommendations?`,

        'lifestyle': `**Lifestyle Modification Recommendations for ${appointment.patientName}:**

**Dietary Changes:**
• Mediterranean-style diet
• Reduce sodium intake (<2000mg/day)
• Increase fiber and omega-3 fatty acids
• Limit processed foods and added sugars

**Physical Activity:**
• 30 minutes moderate exercise, 5 days/week
• Start slowly and gradually increase
• Walking, swimming, or cycling recommended
• Avoid strenuous activity if chest pain present

**Stress Management:**
• Adequate sleep (7-8 hours)
• Relaxation techniques (meditation, deep breathing)
• Regular social activities
• Consider stress counseling if needed

**Risk Factor Management:**
• Smoking cessation if applicable
• Limit alcohol consumption
• Maintain healthy weight (BMI 18.5-24.9)

Would you like printed patient education materials?`,

        'medication': `**Medication Interaction Review for ${appointment.patientName}:**

**Current Considerations:**
• Review complete medication list including OTC drugs
• Check for drug-drug interactions
• Consider age-related metabolism changes
• Monitor for polypharmacy risks

**Key Interactions to Watch:**
• Cardiovascular medications with supplements
• NSAIDs with blood pressure medications
• Statins with certain antibiotics
• Blood thinners with other medications

**Recommendations:**
• Use drug interaction checker database
• Review medication timing for optimal absorption
• Consider pharmacist consultation for complex regimens
• Patient education on avoiding contraindicated substances

Would you like me to check specific medication combinations?`
      };

      // Find matching response based on keywords
      let botResponse = "I understand your question. Based on the available patient data for this appointment, I can help you analyze:\n\n• Clinical findings and observations\n• Test results and trends\n• Treatment recommendations\n• Risk assessment\n\nCould you please be more specific about what aspect you'd like me to focus on?";

      const inputLower = input.toLowerCase();
      if (inputLower.includes('summarize') || inputLower.includes('summary') || inputLower.includes('key finding')) {
        botResponse = responses.summarize;
      } else if (inputLower.includes('concern') || inputLower.includes('worry') || inputLower.includes('problem')) {
        botResponse = responses.concerns;
      } else if (inputLower.includes('compare') || inputLower.includes('previous') || inputLower.includes('trend')) {
        botResponse = responses.compare;
      } else if (inputLower.includes('treatment') || inputLower.includes('therapy') || inputLower.includes('manage')) {
        botResponse = responses.treatment;
      } else if (inputLower.includes('lifestyle') || inputLower.includes('diet') || inputLower.includes('exercise')) {
        botResponse = responses.lifestyle;
      } else if (inputLower.includes('medication') || inputLower.includes('drug') || inputLower.includes('interaction')) {
        botResponse = responses.medication;
      }

      const botMessage = {
        type: 'bot',
        text: botResponse,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMessage]);
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
                <h2 className="text-2xl font-bold text-gray-900">Chat with AI Assistant</h2>
              </div>
              <p className="text-gray-700 mb-2">
                <span className="font-semibold">Patient:</span> {appointment.patientName} • 
                <span className="ml-2">Appointment #{appointment.appointmentNumber}</span>
              </p>
              <p className="text-sm text-gray-600">
                AI has context of all session activities and can help with clinical decisions
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
        <h3 className="text-sm font-bold text-gray-900 mb-3">AI Context Available:</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className={`p-3 rounded-lg border-2 ${hasRecording ? 'bg-green-50 border-green-300' : 'bg-gray-100 border-gray-200'}`}>
            <div className="flex items-center space-x-2">
              {hasRecording ? (
                <Sparkles className="w-4 h-4 text-green-600" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-gray-300"></div>
              )}
              <span className="text-xs font-semibold text-gray-900">Recording</span>
            </div>
          </div>
          <div className={`p-3 rounded-lg border-2 ${hasReport ? 'bg-green-50 border-green-300' : 'bg-gray-100 border-gray-200'}`}>
            <div className="flex items-center space-x-2">
              {hasReport ? (
                <Sparkles className="w-4 h-4 text-green-600" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-gray-300"></div>
              )}
              <span className="text-xs font-semibold text-gray-900">Clinical Report</span>
            </div>
          </div>
          <div className={`p-3 rounded-lg border-2 ${hasTests ? 'bg-green-50 border-green-300' : 'bg-gray-100 border-gray-200'}`}>
            <div className="flex items-center space-x-2">
              {hasTests ? (
                <Sparkles className="w-4 h-4 text-green-600" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-gray-300"></div>
              )}
              <span className="text-xs font-semibold text-gray-900">Test Results</span>
            </div>
          </div>
          <div className={`p-3 rounded-lg border-2 ${appointment.previousAppointments?.length > 0 ? 'bg-green-50 border-green-300' : 'bg-gray-100 border-gray-200'}`}>
            <div className="flex items-center space-x-2">
              {appointment.previousAppointments?.length > 0 ? (
                <Sparkles className="w-4 h-4 text-green-600" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-gray-300"></div>
              )}
              <span className="text-xs font-semibold text-gray-900">History</span>
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
                message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                message.type === 'bot' ? 'bg-blue-600' : 'bg-green-600'
              }`}>
                {message.type === 'bot' ? (
                  <Bot className="w-6 h-6 text-white" />
                ) : (
                  <User className="w-6 h-6 text-white" />
                )}
              </div>
              <div className={`flex-1 ${message.type === 'user' ? 'items-end' : ''}`}>
                <div
                  className={`inline-block max-w-[85%] p-4 rounded-lg ${
                    message.type === 'bot'
                      ? 'bg-white border border-gray-200 text-gray-900'
                      : 'bg-green-600 text-white'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
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
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything about this appointment..."
              className="flex-1 input-field"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors flex items-center ${
                input.trim() 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4 mr-2" />
              Send
            </button>
          </div>

          {/* Suggested Questions */}
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-2">Suggested Questions:</p>
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
            <h4 className="font-semibold text-yellow-900 mb-1">AI Assistant Capabilities</h4>
            <p className="text-sm text-yellow-800 leading-relaxed">
              This AI assistant has been trained on medical literature and has access to all appointment data. 
              It can help with clinical decision support, but final decisions should always be made by the physician. 
              Use this tool to explore treatment options, understand test results, and get second opinions on diagnosis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWithAI;

