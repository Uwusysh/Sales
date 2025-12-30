import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';

// TypeScript declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
    isFinal: boolean;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
    onstart: (() => void) | null;
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
    }
}

interface VoiceInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    minHeight?: string;
    disabled?: boolean;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
    value,
    onChange,
    placeholder = "Type or speak...",
    className = "",
    minHeight = "60px",
    disabled = false
}) => {
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [interimTranscript, setInterimTranscript] = useState('');
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Check for speech recognition support
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setIsSupported(false);
            setError('Speech recognition not supported in this browser');
        }
    }, []);

    // Initialize speech recognition
    const initRecognition = useCallback(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return null;

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-IN'; // English (India) - supports Indian English accent

        recognition.onstart = () => {
            setIsListening(true);
            setError(null);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let finalTranscript = '';
            let interimText = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    finalTranscript += result[0].transcript;
                } else {
                    interimText += result[0].transcript;
                }
            }

            setInterimTranscript(interimText);

            if (finalTranscript) {
                // Append with a space if there's existing text
                const separator = value && !value.endsWith(' ') && !value.endsWith('\n') ? ' ' : '';
                onChange(value + separator + finalTranscript);
                setInterimTranscript('');
            }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
            setInterimTranscript('');

            switch (event.error) {
                case 'not-allowed':
                case 'permission-denied':
                    setError('Microphone permission denied. Please allow microphone access.');
                    break;
                case 'no-speech':
                    setError('No speech detected. Try again.');
                    break;
                case 'audio-capture':
                    setError('No microphone found. Please connect a microphone.');
                    break;
                case 'network':
                    setError('Network error. Please check your connection.');
                    break;
                case 'aborted':
                    // User aborted, no error message needed
                    break;
                default:
                    setError(`Speech error: ${event.error}`);
            }
        };

        recognition.onend = () => {
            setIsListening(false);
            setInterimTranscript('');
        };

        return recognition;
    }, [value, onChange]);

    // Toggle listening
    const toggleListening = useCallback(() => {
        if (!isSupported) {
            setError('Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.');
            return;
        }

        if (isListening) {
            // Stop listening
            recognitionRef.current?.stop();
            setIsListening(false);
            setInterimTranscript('');
        } else {
            // Start listening
            setError(null);
            const recognition = initRecognition();
            if (recognition) {
                recognitionRef.current = recognition;
                try {
                    recognition.start();
                } catch (err) {
                    console.error('Failed to start recognition:', err);
                    setError('Failed to start voice input. Please try again.');
                }
            }
        }
    }, [isListening, isSupported, initRecognition]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            recognitionRef.current?.abort();
        };
    }, []);

    // Clear error after 5 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    // Display value with interim transcript
    const displayValue = interimTranscript
        ? value + (value && !value.endsWith(' ') && !value.endsWith('\n') ? ' ' : '') + interimTranscript
        : value;

    return (
        <div className="relative">
            <div className="relative">
                <textarea
                    ref={textareaRef}
                    value={displayValue}
                    onChange={(e) => {
                        // Only update if not showing interim transcript
                        if (!interimTranscript) {
                            onChange(e.target.value);
                        }
                    }}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`w-full text-sm p-2 pr-12 rounded border border-border ${className}`}
                    style={{ minHeight }}
                />
                
                {/* Mic Button */}
                <button
                    type="button"
                    onClick={toggleListening}
                    disabled={disabled || !isSupported}
                    className={`absolute right-2 top-2 p-2 rounded-lg transition-all duration-200 ${
                        isListening
                            ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30'
                            : isSupported
                                ? 'bg-secondary hover:bg-secondary/80 text-foreground hover:text-primary'
                                : 'bg-muted text-muted-foreground cursor-not-allowed'
                    }`}
                    title={
                        !isSupported
                            ? 'Speech recognition not supported'
                            : isListening
                                ? 'Click to stop listening'
                                : 'Click to start voice input'
                    }
                >
                    {isListening ? (
                        <MicOff className="w-4 h-4" />
                    ) : (
                        <Mic className="w-4 h-4" />
                    )}
                </button>
            </div>

            {/* Listening Indicator */}
            {isListening && (
                <div className="absolute -top-8 right-0 flex items-center gap-2 bg-red-500 text-white text-xs px-3 py-1 rounded-full animate-pulse">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    Listening...
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mt-2 flex items-center gap-2 text-xs text-red-500 bg-red-50 dark:bg-red-950/20 p-2 rounded-lg">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Browser Support Hint */}
            {!isSupported && (
                <p className="mt-1 text-[10px] text-muted-foreground">
                    Voice input works in Chrome, Edge, and Safari
                </p>
            )}
        </div>
    );
};

export default VoiceInput;

