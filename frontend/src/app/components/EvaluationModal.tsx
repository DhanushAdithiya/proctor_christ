// src/components/EvaluationModal.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, RotateCcw } from 'lucide-react';
import ChatInterface from './ChatInterface'; // Assuming you have this component
import MessageInput from './MessageInput';   // Assuming you have this component
import { toast } from 'sonner';

// IMPORT THE CLIENT-SIDE GEMINI EVALUATION FUNCTION
import { handleGeminiEvaluationClient, clearEvaluationSession } from '@/lib/geminiEvaluationClientService';
import { addMarks, markCompleted } from '../actions/labs';
import { add } from 'date-fns';

interface EvaluationModalProps {
    isOpen: boolean;
    onClose: (status: 'complete' | 'cancelled', finalScore: number | null) => void;
    labId: string; // To identify which lab is being evaluated
}

const EvaluationModal: React.FC<EvaluationModalProps> = ({ isOpen, onClose, labId }) => {
    const [messages, setMessages] = useState<{ sender: 'user' | 'llm'; text: string }[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    const [evaluationStatus, setEvaluationStatus] = useState<'in-progress' | 'complete'>('in-progress');
    const [ccScore, setCcScore] = useState<number | null>(null);
    const [vivaScore, setVivaScore] = useState<number | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [currentSessionQuestions, setCurrentSessionQuestions] = useState<string[]>([]); // To store the questions for the current session

    // Scroll to the bottom of the chat on new messages
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    // Effect to start the initial chat when the modal opens
    useEffect(() => {
        const startInitialChat = async () => {
            if (isOpen && messages.length === 0) { // Only trigger if modal is open and chat is empty
                setIsThinking(true);
                try {
                    // Call the client-side Gemini function for the initial bot message
                    // Pass an empty user message as it's the bot's turn to initiate.
                    const { llmResponse, selectedQuestions } = await handleGeminiEvaluationClient(labId, [], "");
                    setMessages([{ sender: 'llm', text: llmResponse }]);
                    setCurrentSessionQuestions(selectedQuestions || []); // Store the questions selected for this session
                    setEvaluationStatus('in-progress');
                } catch (error) {
                    console.error("Failed to start initial evaluation chat:", error);
                    toast.error("Failed to start evaluation. Please check console for details and your API key configuration.");
                    onClose('cancelled', null); // Close modal if initial load fails
                } finally {
                    setIsThinking(false);
                }
            }
        };

        startInitialChat();
    }, [isOpen, labId, messages.length, onClose]); // Re-run when modal opens or labId changes

    // Handler for sending messages
    const handleSendMessage = async (text: string) => {
        if (!text.trim() || isThinking || evaluationStatus !== 'in-progress') return; // Prevent empty messages, double sends, or sending if chat ended

        const newUserMessage = { sender: 'user' as const, text };
        // Optimistically update messages with user's input
        const updatedMessages = [...messages, newUserMessage];
        setMessages(updatedMessages);
        setIsThinking(true);

        try {
            // Call the client-side Gemini evaluation function with the updated history and current user message
            const { llmResponse, conceptClarityScore,
    vivaScorescore, evaluationComplete } =
                await handleGeminiEvaluationClient(labId, updatedMessages, text); // Pass the full history and latest user message

            // Add bot's response to messages
            setMessages(prev => [...prev, { sender: 'llm', text: llmResponse }]);

            if (evaluationComplete) {
                setEvaluationStatus('complete');
                setCcScore(conceptClarityScore)
                setVivaScore(vivaScore)
                toast.success(`Self-evaluation complete! Your score: ${score !== null ? `${score}/3` : 'N/A'}`);
            } else {
                setEvaluationStatus('in-progress'); // Ensure status remains in-progress if not complete
            }

        } catch (error) {
            console.error("Error during LLM evaluation (client-side):", error);
            setMessages(prev => [...prev, { sender: 'llm', text: "Oops! Something went wrong. Please try again." }]);
            toast.error("Failed to get LLM response. Check console.");
        } finally {
            setIsThinking(false);
        }
    };

    // Handler for restarting the evaluation
    const handleRestartEvaluation = () => {
        // Clear the session state
        clearEvaluationSession(labId);
        // Reset component state
        setMessages([]);
        setEvaluationStatus('in-progress');
        setCurrentSessionQuestions([]);
        toast.info("Evaluation restarted. Starting fresh!");
    };

    // Handler for closing the modal with evaluation complete
    const handleCompleteEvaluation = () => {
        onClose('complete', vivaScore);
        markCompleted(labId, sessionStorage.getItem("regno") || "", vivaScore || 0).then((res) => {
            if (res) {
                toast.success("Evaluation complete! Your score: " + (vivaScore !== null ? `${vivaScore}/3` : 'N/A'));
            }
        })

        addMarks(labId, sessionStorage.getItem("regno") || "", ccScore || 0, "conceptClarity").then((res) => {
            if (res) {
                toast.success("Marks added!");
            }
        })

    };

    // Handler for closing the modal (cancel)
    const handleCloseModal = () => {
        // Clear session state when closing
        clearEvaluationSession(labId);
        onClose('cancelled', null);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleCloseModal()}>
            <DialogContent className="sm:max-w-[900px] max-h-[90vh] h-[90vh] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle>Self-Evaluation with LLM</DialogTitle>
                    <DialogDescription>
                        Engage with the AI to self-evaluate your lab submission.
                        {/* Display the questions chosen for this session */}
                    </DialogDescription>
                </DialogHeader>

                {/* Chat container with improved styling */}
                <div 
                    className="flex-1 overflow-y-auto overflow-x-hidden border rounded-lg bg-gray-50/50 p-4 min-h-0" 
                    ref={chatContainerRef}
                    style={{ 
                        scrollBehavior: 'smooth',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word'
                    }}
                >
                    <ChatInterface messages={messages} isThinking={isThinking} />
                </div>

                {/* Input area with improved spacing */}
                <div className="flex-shrink-0 mt-4 space-y-4">
                    {evaluationStatus === 'in-progress' && (
                        <div className="border-t pt-4">
                            <MessageInput onSendMessage={handleSendMessage} />
                        </div>
                    )}
                    
                    {evaluationStatus === 'complete' && (
                        <div className="flex flex-col items-center gap-4 border-t pt-4">
                            <div className="flex items-center gap-2 text-green-600 font-semibold">
                                <CheckCircle className="h-5 w-5" />
                                <span>Evaluation Complete!</span>
                                {vivaScore !== null && (
                                    <span className="ml-2 px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm font-medium">
                                        Score: {vivaScore}/3
                                    </span>
                                )}
                            </div>
                            
                            <div className="flex gap-3">
                                <Button
                                    onClick={handleCompleteEvaluation}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    Confirm & Close
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default EvaluationModal;