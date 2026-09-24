import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Send,
} from 'lucide-react';
import { requestVoiceAssist, VoiceAssistResponse } from '../utils/api';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyParsedData: (data: {
    title: string;
    description: string;
    category: string;
    locationName: string;
  }) => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  onApplyParsedData,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedResult, setParsedResult] = useState<VoiceAssistResponse['data'] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(true);
  const recognitionRef = useRef<any>(null);

  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          setErrorMessage(null);
        };

        recognition.onresult = (event: any) => {
          let current = '';
          for (let i = 0; i < event.results.length; i++) {
            current += event.results[i][0].transcript;
          }
          setTranscript(current);
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition event error:', event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') {
            setErrorMessage('Microphone access denied. You can type your voice observation below.');
          } else {
            setErrorMessage(`Microphone status: ${event.error}. You can also type or use test prompts.`);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } else {
        setHasSpeechSupport(false);
      }
    }
  }, []);

  if (!isOpen) return null;

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setErrorMessage('Browser speech recognition not available in this environment. Please type or use sample prompts.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setParsedResult(null);
      setErrorMessage(null);
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Recognition start exception:', err);
      }
    }
  };

  const handleProcessSpeech = async (textToProcess?: string) => {
    const speechText = textToProcess || transcript;
    if (!speechText.trim()) {
      setErrorMessage('Please speak or type a civic problem description first.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await requestVoiceAssist(speechText);
      if (res.success && res.data) {
        setParsedResult(res.data);

        // Vocal audio confirmation via browser SpeechSynthesis
        if ('speechSynthesis' in window && res.data.spokenConfirmation) {
          window.speechSynthesis.cancel(); // Stop any pending speech
          const utterance = new SpeechSynthesisUtterance(res.data.spokenConfirmation);
          utterance.rate = 1.05;
          utterance.pitch = 1.0;
          window.speechSynthesis.speak(utterance);
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Voice AI triage failed. You can proceed with manual entry.');
    } finally {
      setIsProcessing(false);
    }
  };

  const sampleVoicePrompts = [
    'Huge water leak gushing from the road near Market and 4th street, flooding the bike lane!',
    'Severe deep pothole on 16th and Mission causing cars to swerve into oncoming traffic.',
    'Broken streetlight pole hanging over the crosswalk with exposed high voltage wires near the school.',
    'Massive garbage heap dumped behind the restaurant alley blocking pedestrian walkway.',
  ];

  const handleTransferToReport = () => {
    if (parsedResult) {
      onApplyParsedData({
        title: parsedResult.extractedTitle,
        description: parsedResult.extractedDescription,
        category: parsedResult.detectedCategory,
        locationName: parsedResult.suggestedLocationText,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/85 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Mic className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">CityNexus AI Voice Assistant</h2>
              <p className="text-xs text-slate-400">
                Natural Citizen Speech-to-Civic Dispatch Intelligence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Big Microphone Visual & Trigger */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className="relative my-2">
              {isListening && (
                <>
                  <div className="absolute -inset-4 rounded-full bg-sky-500/20 animate-ping" />
                  <div className="absolute -inset-8 rounded-full bg-sky-500/10 animate-pulse" />
                </>
              )}
              <button
                type="button"
                onClick={toggleListening}
                className={`relative flex h-24 w-24 items-center justify-center rounded-full shadow-2xl transition-all ${
                  isListening
                    ? 'bg-rose-500 text-white scale-110 ring-4 ring-rose-400/40'
                    : 'bg-gradient-to-tr from-sky-500 to-cyan-400 text-slate-950 hover:scale-105 ring-4 ring-sky-500/30'
                }`}
              >
                {isListening ? (
                  <MicOff className="h-10 w-10" />
                ) : (
                  <Mic className="h-10 w-10 text-slate-950" />
                )}
              </button>
            </div>

            <p className="mt-3 text-sm font-bold text-white">
              {isListening ? 'Listening... Speak your civic problem now' : 'Tap to Start Voice Reporting'}
            </p>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Example: &quot;Huge water leak flooding the road on 5th avenue near the school.&quot;
            </p>
          </div>

          {/* Live Transcript Box */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Recognized Speech:
              </span>
              {transcript && (
                <button
                  onClick={() => setTranscript('')}
                  className="text-[11px] text-slate-500 hover:text-slate-300"
                >
                  Clear
                </button>
              )}
            </div>

            <textarea
              rows={3}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Your spoken words will transcribe here in real-time, or you can type directly..."
              className="w-full bg-transparent text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none resize-none leading-relaxed"
            />

            {transcript && (
              <button
                type="button"
                onClick={() => handleProcessSpeech()}
                disabled={isProcessing}
                className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-sky-500 py-2 text-xs font-bold text-slate-950 hover:bg-sky-400 transition-colors disabled:opacity-60"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Gemini AI is parsing your speech...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Extract Civic Intelligence & Confirm</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Quick-Test Spoken Prompts */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Or Try a Pre-Recorded Spoken Scenario:
            </span>
            <div className="mt-2 space-y-1.5">
              {sampleVoicePrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setTranscript(prompt);
                    handleProcessSpeech(prompt);
                  }}
                  className="w-full text-left rounded-xl border border-slate-800 bg-slate-950/60 p-2 text-xs text-slate-300 hover:border-sky-500/50 hover:text-sky-300 transition-colors"
                >
                  &ldquo;{prompt}&rdquo;
                </button>
              ))}
            </div>
          </div>

          {/* AI Extraction Result Card */}
          {parsedResult && (
            <div className="rounded-2xl border border-sky-500/40 bg-sky-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-sky-900/40 pb-2">
                <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-sky-400" />
                  Voice Analysis & Audio Feedback Complete
                </span>
                <span className="rounded-md bg-sky-900/60 px-2 py-0.5 text-[10px] font-bold text-sky-200">
                  {parsedResult.detectedCategory}
                </span>
              </div>

              <div className="text-xs space-y-1.5">
                <p>
                  <strong className="text-white">Ticket Title:</strong> {parsedResult.extractedTitle}
                </p>
                <p>
                  <strong className="text-white">Detected Location:</strong>{' '}
                  {parsedResult.suggestedLocationText}
                </p>
                <p>
                  <strong className="text-white">Estimated Urgency:</strong>{' '}
                  <span className="text-amber-300 font-bold">{parsedResult.estimatedUrgency}</span>
                </p>
                <div className="rounded-lg bg-sky-950/80 p-2.5 border border-sky-900/60 text-sky-200 text-xs flex items-start gap-2">
                  <Volume2 className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block">
                      Synthetic Audio Response:
                    </span>
                    &ldquo;{parsedResult.spokenConfirmation}&rdquo;
                  </div>
                </div>
              </div>

              <button
                onClick={handleTransferToReport}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-2.5 text-xs font-bold text-slate-950 shadow-md hover:from-emerald-400 hover:to-teal-400 transition-all"
              >
                <span>Transfer Pre-Filled Data to Civic Report</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-xl border border-rose-900/40 bg-rose-950/20 p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
