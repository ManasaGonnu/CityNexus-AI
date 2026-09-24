import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Mic,
  MicOff,
  Sparkles,
  Bot,
  User as UserIcon,
  CheckCircle2,
  Loader2,
  MapPin,
  FileText,
  Phone,
  PhoneOff,
  PhoneCall,
  Volume2,
  VolumeX,
  Radio,
  Zap,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { sendChatMessage, createIssue, CivicIncident } from '../utils/api';
import { User } from '../types/auth';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  draftReport?: {
    title: string;
    description: string;
    category: 'Pothole' | 'Garbage' | 'Water Leakage' | 'Drainage' | 'Broken Streetlight' | 'Other';
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    locationName: string;
    coords?: { lat: number; lng: number };
  };
  submittedIncidentId?: string;
}

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onIssueSubmitted: (newIncident: CivicIncident) => void;
  isFullPageView?: boolean;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  user,
  onIssueSubmitted,
  isFullPageView = false,
}) => {
  // Navigation between Mode 1 (Chatbot) and Mode 2 (Live Voice Call)
  const [activeMode, setActiveMode] = useState<'chat' | 'call'>('chat');

  // Mode 1: Chatbot State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: `Hello ${user.name.split(' ')[0]}! I am your CityNexus AI urban intelligence dispatcher. Describe any road hazard, water leak, garbage accumulation, or electrical danger in your area, and I will draft and register a verified ticket for municipal teams.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submittingDraftId, setSubmittingDraftId] = useState<string | null>(null);
  const [isDictating, setIsDictating] = useState(false);
  const dictationRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mode 2: Live Voice Call Simulator State
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDurationSecs, setCallDurationSecs] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [callTranscript, setCallTranscript] = useState<Array<{ sender: 'ai' | 'citizen'; text: string }>>([]);
  const [callLiveLoggedIncident, setCallLiveLoggedIncident] = useState<CivicIncident | null>(null);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const callRecognitionRef = useRef<any>(null);
  const callTimerRef = useRef<any>(null);

  // Scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && activeMode === 'chat') {
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen, messages, activeMode]);

  // Initialize browser Dictation for chatbot input
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsDictating(true);
        recognition.onresult = (event: any) => {
          const text = event.results[0][0].transcript;
          setInputText((prev) => (prev ? `${prev} ${text}` : text));
          setIsDictating(false);
        };
        recognition.onerror = () => setIsDictating(false);
        recognition.onend = () => setIsDictating(false);

        dictationRef.current = recognition;
      }
    }
  }, []);

  // Call timer interval
  useEffect(() => {
    if (isCallActive) {
      callTimerRef.current = setInterval(() => {
        setCallDurationSecs((prev) => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      setCallDurationSecs(0);
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [isCallActive]);

  // Voice Synthesis Helper
  const speakText = (text: string, onEndCallback?: () => void) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEndCallback) onEndCallback();
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      utterance.onstart = () => setIsAiSpeaking(true);
      utterance.onend = () => {
        setIsAiSpeaking(false);
        if (onEndCallback) onEndCallback();
      };
      utterance.onerror = () => {
        setIsAiSpeaking(false);
        if (onEndCallback) onEndCallback();
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
      setIsAiSpeaking(false);
      if (onEndCallback) onEndCallback();
    }
  };

  // Start Live Smart City Dispatch Voice Call
  const handleStartCall = () => {
    setActiveMode('call');
    setIsCallActive(true);
    setCallTranscript([]);
    setCallLiveLoggedIncident(null);
    setIsMuted(false);

    const greeting = 'Hello, I am CityNexus AI. Please describe the urban hazard or issue you are facing.';
    setCallTranscript([{ sender: 'ai', text: greeting }]);

    // AI speaks first using window.speechSynthesis
    speakText(greeting, () => {
      startListeningInCall();
    });
  };

  // Listen to citizen in continuous call mode
  const startListeningInCall = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    try {
      if (callRecognitionRef.current) {
        callRecognitionRef.current.stop();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = async (event: any) => {
        const lastIdx = event.results.length - 1;
        const citizenSpeech = event.results[lastIdx][0].transcript.trim();

        if (citizenSpeech && !isMuted) {
          setCallTranscript((prev) => [...prev, { sender: 'citizen', text: citizenSpeech }]);

          // Process speech with conversational AI and auto-log
          await handleProcessCallCitizenSpeech(citizenSpeech);
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Call recognition error:', e.error);
      };

      recognition.start();
      callRecognitionRef.current = recognition;
    } catch (err) {
      console.warn('Recognition start failed:', err);
    }
  };

  // Process Citizen Speech in Call: synthesize verbal response + live-log into dispatch system
  const handleProcessCallCitizenSpeech = async (speech: string) => {
    // 1. Send to chat assistant
    try {
      const res = await sendChatMessage(speech, []);
      let replyText = 'I have recorded your report and escalated it to the municipal response team.';

      if (res.success && res.data) {
        replyText = res.data.reply;

        // If draft issue detected, live-log it into the municipal dispatch system!
        if (res.data.draftReport && !callLiveLoggedIncident) {
          const draft = res.data.draftReport;
          const formData = new FormData();
          formData.append('title', draft.title);
          formData.append('description', draft.description);
          formData.append('category', draft.category);
          formData.append('locationName', draft.locationName);
          formData.append('lat', String(draft.coords?.lat || 17.3850));
          formData.append('lng', String(draft.coords?.lng || 78.4867));
          formData.append('reportedBy', `${user.name} (Live Voice Dispatch)`);

          const createRes = await createIssue(formData);
          if (createRes.success && createRes.data) {
            setCallLiveLoggedIncident(createRes.data);
            onIssueSubmitted(createRes.data);
            replyText += ` Ticket #${createRes.data.id} has been registered and routed to ${createRes.data.assignedDepartment}.`;
          }
        }
      }

      setCallTranscript((prev) => [...prev, { sender: 'ai', text: replyText }]);

      // Vocal guidance synthesized back to citizen
      speakText(replyText);
    } catch (err) {
      console.warn('Call processing error:', err);
    }
  };

  // End Call
  const handleEndCall = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (callRecognitionRef.current) {
      callRecognitionRef.current.stop();
      callRecognitionRef.current = null;
    }
    setIsCallActive(false);
    setIsAiSpeaking(false);
  };

  // Toggle Mute in Call
  const toggleCallMute = () => {
    setIsMuted((prev) => !prev);
  };

  // Toggle Chatbot dictation
  const toggleDictation = () => {
    if (!dictationRef.current) return;
    if (isDictating) {
      dictationRef.current.stop();
      setIsDictating(false);
    } else {
      try {
        dictationRef.current.start();
      } catch (err) {
        console.warn(err);
      }
    }
  };

  // Send Chat message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputText.trim();
    if (!query || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const historyContext = messages.map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const res = await sendChatMessage(query, historyContext);
      if (res.success && res.data) {
        const aiMessage: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          text: res.data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          draftReport: res.data.hasDraftReport ? res.data.draftReport : undefined,
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (err) {
      console.error(err);
      const errorMessage: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        sender: 'assistant',
        text: 'I could not process that request right now. Please try again or use the Report Issue button.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm and Submit AI Extracted Draft Ticket
  const handleConfirmDraftSubmit = async (msgId: string, draft: ChatMessage['draftReport']) => {
    if (!draft) return;
    setSubmittingDraftId(msgId);

    try {
      const formData = new FormData();
      formData.append('title', draft.title);
      formData.append('description', draft.description);
      formData.append('category', draft.category);
      formData.append('locationName', draft.locationName);
      formData.append('lat', String(draft.coords?.lat || 17.3850));
      formData.append('lng', String(draft.coords?.lng || 78.4867));
      formData.append('reportedBy', `${user.name} (CityNexus AI)`);

      const res = await createIssue(formData);
      if (res.success && res.data) {
        onIssueSubmitted(res.data);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId ? { ...m, submittedIncidentId: res.data.id } : m
          )
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingDraftId(null);
    }
  };

  // Format seconds to mm:ss
  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div
      className={
        isFullPageView
          ? 'w-full min-h-[calc(100vh-65px)] bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 flex items-center justify-center transition-colors'
          : 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in'
      }
    >
      <div
        className={`relative w-full max-w-3xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col transition-colors ${
          isFullPageView ? 'h-[720px] max-h-[85vh]' : 'h-[660px] max-h-[92vh]'
        }`}
      >
        {/* Header Bar with Mode Switcher & Call Button */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/80 px-6 py-3.5 backdrop-blur-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-sm">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">CityNexus AI Assistant</h2>
                <span className="rounded-md bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Live Dispatch Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Text chat, voice dictation, &amp; direct AI emergency call simulator
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Prominent Styled "Call AI Assistant" Button */}
            {!isCallActive ? (
              <button
                type="button"
                onClick={handleStartCall}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:from-emerald-500 hover:to-teal-500 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Phone className="h-3.5 w-3.5 animate-pulse" />
                <span>Call AI Assistant</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleEndCall}
                className="flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-red-500 transition-all"
              >
                <PhoneOff className="h-3.5 w-3.5" />
                <span>End Call</span>
              </button>
            )}

            {!isFullPageView && (
              <button
                onClick={onClose}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Tab Switcher (Chatbot vs Live Voice Call) */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-2 gap-2 text-xs">
          <button
            onClick={() => setActiveMode('chat')}
            className={`px-3 py-1 rounded-xl font-bold transition-all ${
              activeMode === 'chat'
                ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Chat &amp; Dictation Mode
          </button>

          <button
            onClick={() => {
              setActiveMode('call');
              if (!isCallActive) handleStartCall();
            }}
            className={`px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
              activeMode === 'call'
                ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Radio className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Direct Voice Call Dispatch</span>
            {isCallActive && (
              <span className="ml-1 rounded-full bg-emerald-600 px-1.5 py-0.2 text-[9px] text-white">
                {formatDuration(callDurationSecs)}
              </span>
            )}
          </button>
        </div>

        {/* MODE 2: REALISTIC SMART CITY DISPATCH VOICE CALL INTERFACE */}
        {activeMode === 'call' && (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-between bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white animate-in fade-in">
            {/* Top Call Info */}
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg shadow-emerald-500/20 relative">
                <PhoneCall className="h-8 w-8 animate-pulse" />
                {isCallActive && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-500"></span>
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-base font-black tracking-wide text-white">
                  Connected — CityNexus Urban Dispatcher
                </h3>
                <p className="text-xs font-mono text-emerald-400">
                  Call Active • {formatDuration(callDurationSecs)}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Continuous Voice Recognition &amp; Speech Synthesis Enabled
                </p>
              </div>
            </div>

            {/* Live Audio Visualizer Waveform (Dynamic CSS Animation) */}
            <div className="py-6 flex flex-col items-center justify-center gap-3">
              <div className="flex items-center justify-center gap-1.5 h-16 w-full max-w-xs">
                {[12, 28, 45, 60, 32, 50, 65, 40, 55, 70, 48, 25, 60, 38, 52, 22].map(
                  (height, idx) => (
                    <div
                      key={idx}
                      className={`w-2 rounded-full transition-all duration-300 ${
                        isAiSpeaking
                          ? 'bg-gradient-to-t from-emerald-500 to-sky-400 animate-pulse'
                          : 'bg-emerald-500/60'
                      }`}
                      style={{
                        height: isAiSpeaking
                          ? `${Math.max(14, (height * (1 + (idx % 3) * 0.2)) % 64)}px`
                          : `${Math.max(8, height * 0.35)}px`,
                      }}
                    />
                  )
                )}
              </div>
              <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                {isAiSpeaking ? 'AI Dispatcher Speaking...' : isMuted ? 'Microphone Muted' : 'Listening to your voice...'}
              </span>
            </div>

            {/* Live Conversation Transcript & Auto-Logger Card */}
            <div className="space-y-3 max-h-48 overflow-y-auto px-4">
              {callLiveLoggedIncident && (
                <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/60 p-3.5 backdrop-blur-md flex items-center justify-between gap-3 animate-in zoom-in-95">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-emerald-300">
                          {callLiveLoggedIncident.id}
                        </span>
                        <span className="rounded bg-emerald-400/20 px-1.5 py-0.2 text-[9px] font-bold text-emerald-300">
                          AUTO-LOGGED
                        </span>
                      </div>
                      <p className="text-xs font-bold text-white line-clamp-1">
                        {callLiveLoggedIncident.title}
                      </p>
                      <p className="text-[10px] text-slate-300">
                        📍 {callLiveLoggedIncident.locationName} • Routed to {callLiveLoggedIncident.assignedDepartment}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {callTranscript.map((entry, idx) => (
                <div
                  key={idx}
                  className={`rounded-2xl p-3 text-xs leading-relaxed ${
                    entry.sender === 'ai'
                      ? 'bg-slate-800/80 text-slate-200 border border-slate-700/50'
                      : 'bg-sky-600/80 text-white ml-6'
                  }`}
                >
                  <strong className="block text-[10px] text-slate-400 uppercase mb-0.5">
                    {entry.sender === 'ai' ? 'CityNexus Dispatcher' : 'You (Citizen)'}
                  </strong>
                  <p>{entry.text}</p>
                </div>
              ))}
            </div>

            {/* Call Action Controls (Mute, End Call, Restart) */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-center gap-6">
              <button
                type="button"
                onClick={toggleCallMute}
                className={`flex h-12 w-12 items-center justify-center rounded-full border transition-all ${
                  isMuted
                    ? 'border-amber-400 bg-amber-500/20 text-amber-400 ring-2 ring-amber-400/30'
                    : 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
                title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>

              <button
                type="button"
                onClick={handleEndCall}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-600/40 hover:bg-red-500 transition-all hover:scale-105 active:scale-95"
                title="End Call"
              >
                <PhoneOff className="h-6 w-6" />
              </button>

              <button
                type="button"
                onClick={() => {
                  speakText('CityNexus AI Dispatch is listening. Please state your exact location and the hazard.');
                }}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 transition-all"
                title="Repeat Dispatch Prompt"
              >
                <Volume2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* MODE 1: INTERACTIVE CHATBOT & VOICE DICTATION */}
        {activeMode === 'chat' && (
          <>
            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50 dark:bg-slate-950/60">
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}

                    <div className="max-w-[85%] sm:max-w-[78%] space-y-2">
                      <div
                        className={`rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs ${
                          isUser
                            ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white rounded-tr-none'
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-none shadow-xs'
                        }`}
                      >
                        <p>{msg.text}</p>
                        <span
                          className={`block text-[9px] mt-1 text-right ${
                            isUser ? 'text-sky-100' : 'text-slate-400 dark:text-slate-400'
                          }`}
                        >
                          {msg.timestamp}
                        </span>
                      </div>

                      {/* Structured Issue Card Auto-Extracted with 1-Click Submit */}
                      {msg.draftReport && (
                        <div className="rounded-2xl border border-sky-200 dark:border-sky-800 bg-sky-50/90 dark:bg-slate-800/90 p-4 space-y-3 shadow-sm animate-in fade-in">
                          <div className="flex items-center justify-between border-b border-sky-100 dark:border-slate-700 pb-2">
                            <div className="flex items-center gap-1.5">
                              <FileText className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                              <span className="text-xs font-bold text-sky-950 dark:text-sky-200 uppercase tracking-wider">
                                Auto-Extracted Civic Complaint
                              </span>
                            </div>
                            <span className="rounded bg-sky-100 dark:bg-sky-950/80 px-2 py-0.5 text-[10px] font-bold text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                              {msg.draftReport.category}
                            </span>
                          </div>

                          <div className="text-xs space-y-1">
                            <h4 className="font-bold text-slate-900 dark:text-white">{msg.draftReport.title}</h4>
                            <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                              {msg.draftReport.description}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-sky-600 dark:text-sky-400" />
                              <span>{msg.draftReport.locationName}</span>
                            </p>
                          </div>

                          <div className="pt-2 border-t border-sky-100 dark:border-slate-700 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                              Severity: {msg.draftReport.severity}
                            </span>

                            {msg.submittedIncidentId ? (
                              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Registered ({msg.submittedIncidentId})</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={submittingDraftId === msg.id}
                                onClick={() => handleConfirmDraftSubmit(msg.id, msg.draftReport)}
                                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-1.5 text-xs font-bold text-white hover:from-emerald-500 hover:to-teal-500 transition-all shadow-xs"
                              >
                                {submittingDraftId === msg.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                )}
                                <span>Submit to Municipality</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {isUser && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs">
                        <UserIcon className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex gap-3 justify-start animate-in fade-in">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 shadow-xs flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-sky-600 dark:text-sky-400" />
                    <span className="text-xs text-slate-500 dark:text-slate-400">Analyzing civic incident...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 overflow-x-auto text-[11px]">
              <span className="text-slate-400 dark:text-slate-500 font-medium shrink-0">Quick prompt:</span>
              <button
                type="button"
                onClick={() => setInputText('Deep pothole near metro pillar 42 causing traffic bottleneck')}
                className="rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-slate-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-sky-950/60 hover:text-sky-700 dark:hover:text-sky-300 shrink-0"
              >
                Pothole on Main Road
              </button>
              <button
                type="button"
                onClick={() => setInputText('High-pressure water pipe burst flooding cross street')}
                className="rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-slate-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-sky-950/60 hover:text-sky-700 dark:hover:text-sky-300 shrink-0"
              >
                Burst Water Pipe
              </button>
              <button
                type="button"
                onClick={() => setInputText('Exposed live electrical wires dangling near footpath')}
                className="rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-slate-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-sky-950/60 hover:text-sky-700 dark:hover:text-sky-300 shrink-0"
              >
                Exposed Wires
              </button>
            </div>

            {/* Chatbot Input Bar */}
            <div className="border-t border-slate-100 dark:border-slate-800 p-3 bg-white dark:bg-slate-900">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                {/* Voice Dictation Microphone Button */}
                <button
                  type="button"
                  onClick={toggleDictation}
                  title={isDictating ? 'Listening... click to pause' : 'Dictate using microphone'}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition-all ${
                    isDictating
                      ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 animate-pulse ring-2 ring-red-300 dark:ring-red-800'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-sky-950/60 hover:text-sky-700 dark:hover:text-sky-300 hover:border-sky-300 dark:hover:border-sky-700'
                  }`}
                >
                  {isDictating ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>

                <input
                  type="text"
                  placeholder={
                    isDictating
                      ? 'Listening to your voice dictation...'
                      : 'Describe road damage, flooding, or ask a question...'
                  }
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900"
                />

                <button
                  type="submit"
                  disabled={isLoading || !inputText.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-sm hover:bg-sky-500 transition-all disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>

              <p className="mt-1.5 text-center text-[10px] text-slate-400 dark:text-slate-500">
                Natural language parsing extracts category, location, and severity into actionable municipal tickets
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
