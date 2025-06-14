// components/MessageInput.tsx

import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Mic, Send, StopCircle } from 'lucide-react';
import { toast } from 'sonner';

interface MessageInputProps {
    onSendMessage: (text: string) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage }) => {
    const [inputValue, setInputValue] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [cursorPosition, setCursorPosition] = useState(0);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    const resizeTextarea = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    };

    // Initialize Web Speech API
    useEffect(() => {
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                
                // Insert the transcript at the current cursor position
                const beforeCursor = inputValue.substring(0, cursorPosition);
                const afterCursor = inputValue.substring(cursorPosition);
                const newValue = beforeCursor + (beforeCursor && !beforeCursor.endsWith(' ') ? ' ' : '') + transcript + (afterCursor && !afterCursor.startsWith(' ') ? ' ' : '') + afterCursor;
                
                setInputValue(newValue);
                
                // Update cursor position to be after the inserted text
                const newCursorPosition = beforeCursor.length + transcript.length + (beforeCursor && !beforeCursor.endsWith(' ') ? 1 : 0) + (afterCursor && !afterCursor.startsWith(' ') ? 1 : 0);
                setCursorPosition(newCursorPosition);
                
                // Set cursor position and resize textarea after state update
                setTimeout(() => {
                    if (textareaRef.current) {
                        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
                        textareaRef.current.focus();
                        resizeTextarea();
                    }
                }, 0);
                
                toast.info("Voice input added: " + transcript);
            };

            recognitionRef.current.onerror = (event) => {
                console.error("Speech recognition error:", event.error);
                toast.error(`Voice input error: ${event.error}`);
                setIsRecording(false);
            };

            recognitionRef.current.onend = () => {
                setIsRecording(false);
            };
        } else {
            console.warn("Web Speech API not supported in this browser.");
            toast.warning("Voice input not supported in your browser.");
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, [inputValue, cursorPosition]);

    // Resize textarea when content changes
    useEffect(() => {
        resizeTextarea();
    }, [inputValue]);

    // Track cursor position when user clicks or types
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputValue(e.target.value);
        setCursorPosition(e.target.selectionStart || 0);
    };

    const handleInputClick = () => {
        if (textareaRef.current) {
            setCursorPosition(textareaRef.current.selectionStart || 0);
        }
    };

    const handleInputKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (textareaRef.current) {
            setCursorPosition(textareaRef.current.selectionStart || 0);
        }
    };

    const handleSendClick = () => {
        if (inputValue.trim()) {
            onSendMessage(inputValue);
            setInputValue('');
            setCursorPosition(0);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendClick();
        }
    };

    const handleVoiceToggle = () => {
        if (!recognitionRef.current) {
            toast.error("Voice input is not available.");
            return;
        }

        if (isRecording) {
            recognitionRef.current.stop();
            setIsRecording(false);
            toast.info("Voice input stopped.");
        } else {
            try {
                // Update cursor position before starting recording
                if (textareaRef.current) {
                    setCursorPosition(textareaRef.current.selectionStart || 0);
                }
                
                recognitionRef.current.start();
                setIsRecording(true);
                toast.success("Listening for voice input...");
            } catch (error) {
                console.error("Error starting speech recognition:", error);
                toast.error("Failed to start voice input. Please check microphone permissions.");
                setIsRecording(false);
            }
        }
    };

    return (
        <div className="flex items-end space-x-2">
            <Button
                variant="outline"
                size="icon"
                onClick={handleVoiceToggle}
                className={`flex-shrink-0 ${isRecording ? "bg-red-500 hover:bg-red-600 text-white" : ""}`}
                title={isRecording ? "Stop Recording" : "Start Voice Input"}
            >
                {isRecording ? <StopCircle className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleInputChange}
                onClick={handleInputClick}
                onKeyUp={handleInputKeyUp}
                onKeyDown={handleKeyPress}
                placeholder={isRecording ? "Listening..." : "Type your message... (Shift+Enter for new line)"}
                className="flex-1 min-h-[44px] max-h-[200px] resize-none"
                rows={1}
            />
            <Button 
                onClick={handleSendClick} 
                disabled={!inputValue.trim()}
                className="flex-shrink-0"
            >
                <Send className="h-5 w-5 mr-2" />
                Send
            </Button>
        </div>
    );
};

export default MessageInput;