import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 
import { fetchLabInfo } from "@/app/actions/labs";
import JSZip from 'jszip';

import mammoth from 'mammoth';



// /**
//  * Fetches lab details and questions using the existing fetchLabInfo function
//  * You need to import this function: import { fetchLabInfo } from 'path/to/your/function'
//  * @param {string} labId - The lab ID to fetch details for
//  * @returns {Promise<{questionsArray: string[], labName: string, labDescription: string, subjectId: string}>}
//  */
// async function fetchLabDetailsAndQuestions(labId) {
//     try {
//         const result = await fetchLabInfo(labId);

//         if (!result.success) {
//             throw new Error(result.error || "Failed to fetch lab details");
//         }

//         const lab = result.lab;

//         let questionsArray = [];

//         if (lab.vivaQuestions) {

//             // Fetch the content from the URL
//             const response = await fetch(lab.vivaQuestions);
//             console.log(response)

//             if (!response.ok) {
//                 throw new Error(`Failed to download viva questions from ${lab.vivaQuestions}: ${response.statusText}`);
//             }

//             const blob = await response.blob();
//             const arrayBuffer = await blob.arrayBuffer();

//             try {
//                 const result = await mammoth.extractRawText({ arrayBuffer });
//                 const questionsContent = result.value;
//                 questionsArray = parseQuestionsContent(questionsContent);
//             } catch (err) {
//                 console.error("Mammoth failed:", err);

//                 // Try JSZip to check if it's a valid .docx (optional)
//                 try {
//                     const zip = await JSZip.loadAsync(arrayBuffer);
//                     console.log("It is a valid ZIP, but Mammoth still failed");
//                 } catch {
//                     console.error("Not even a valid .docx/ZIP");
//                 }

//                 throw new Error("This .docx file is unsupported or malformed for in-browser parsing");
//             }




//             const questionsContent = result.value;


//             questionsArray = parseQuestionsContent(questionsContent);

//         } else {
//             console.warn(`No vivaQuestions URL found for lab ID: ${labId}`);
//         }

//         return {
//             questionsArray,
//             labName: lab.name || "Lab",
//             labDescription: lab.description || "",
//             subjectId: lab.subjectId.toString() || ""
//         };
//     } catch (error) {
//         console.error("Error fetching lab details:", error);
//         throw new Error("Unable to fetch lab details from database or download viva questions");
//     }
// }

async function fetchLabDetailsAndQuestions(labId) {
    try {
        const result = await fetchLabInfo(labId);
        if (!result.success) {
            throw new Error(result.error || "Failed to fetch lab details");
        }
        
        const lab = result.lab;
        let questionsArray = [];
        
        if (lab.vivaQuestions) {
            try {
                // Add timeout and better headers
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
                
                const response = await fetch(lab.vivaQuestions, {
                    signal: controller.signal,
                    headers: {
                        'Accept': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/msword, */*',
                        'Cache-Control': 'no-cache'
                    },
                    mode: 'cors' // Explicitly set CORS mode
                });
                
                clearTimeout(timeoutId);
                
                console.log('Response status:', response.status);
                console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const blob = await response.blob();
                console.log('Downloaded blob - Size:', blob.size, 'Type:', blob.type);
                
                if (blob.size === 0) {
                    throw new Error('Downloaded file is empty');
                }
                
                // Check if it's actually a Word document by examining the blob type
                const validTypes = [
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/msword',
                    'application/octet-stream' // Sometimes Word docs are served as this
                ];
                
                if (blob.type && !validTypes.includes(blob.type) && !blob.type.includes('word')) {
                    console.warn('Unexpected blob type:', blob.type);
                }
                
                const arrayBuffer = await blob.arrayBuffer();
                console.log('ArrayBuffer size:', arrayBuffer.byteLength);
                
                // Check for ZIP signature (first few bytes of .docx files)
                const uint8Array = new Uint8Array(arrayBuffer, 0, 4);
                const signature = Array.from(uint8Array).map(b => b.toString(16).padStart(2, '0')).join('');
                console.log('File signature:', signature);
                
                // .docx files should start with PK (ZIP signature: 50 4B)
                if (!signature.startsWith('504b')) {
                    console.warn('File does not have ZIP signature, might be .doc format or corrupted');
                    throw new Error('File appears to be in unsupported format (.doc) or corrupted. Please ensure the file is a valid .docx document.');
                }
                
                // Try parsing with mammoth
                const parseResult = await mammoth.extractRawText({ arrayBuffer });
                console.log('Mammoth parsing successful, text length:', parseResult.value.length);
                
                if (!parseResult.value || parseResult.value.trim().length === 0) {
                    throw new Error('Document appears to be empty or contains no readable text');
                }
                
                questionsArray = parseQuestionsContent(parseResult.value);
                console.log('Parsed questions count:', questionsArray.length);
                
            } catch (fetchError) {
                console.error("Error downloading or parsing viva questions:", fetchError);
                
                // Provide more specific error messages
                if (fetchError.name === 'TypeError' && fetchError.message.includes('fetch')) {
                    throw new Error(`Network error: Unable to download viva questions. Please check your internet connection and the file URL: ${lab.vivaQuestions}`);
                } else if (fetchError.message.includes('CORS')) {
                    throw new Error(`Access denied: The server hosting the viva questions does not allow cross-origin requests. URL: ${lab.vivaQuestions}`);
                } else if (fetchError.message.includes('AbortError')) {
                    throw new Error('Download timeout: The viva questions file took too long to download');
                } else {
                    throw new Error(`Failed to process viva questions: ${fetchError.message}`);
                }
            }
        } else {
            console.warn(`No vivaQuestions URL found for lab ID: ${labId}`);
        }
        
        return {
            questionsArray,
            labName: lab.name || "Lab",
            labDescription: lab.description || "",
            subjectId: lab.subjectId.toString() || ""
        };
        
    } catch (error) {
        console.error("Error fetching lab details:", error);
        throw error; // Re-throw the specific error instead of a generic one
    }
}


/**
 * Parses questions content directly from the vivaQuestions field
 * @param {string} questionsContent - The content of the questions file
 * @returns {string[]} Array of parsed questions
 */
function parseQuestionsContent(questionsContent) {
    if (!questionsContent || questionsContent.trim() === "") {
        throw new Error("Questions content is empty");
    }

    let questions = [];

    // Try different parsing strategies
    if (questionsContent.includes('\n')) {
        questions = questionsContent.split('\n')
            .map(q => q.trim())
            .filter(q => q.length > 0)
            .map(q => q.replace(/^\d+\.?\s*/, '')) // Remove numbering like "1. " or "1) "
            .map(q => q.replace(/^[•\-\*]\s*/, '')); // Remove bullet points
    } else if (questionsContent.includes(';')) {
        questions = questionsContent.split(';')
            .map(q => q.trim())
            .filter(q => q.length > 0);
    } else if (questionsContent.includes('?')) {
        // Split by question marks and reconstruct
        const parts = questionsContent.split('?');
        questions = parts
            .slice(0, -1) // Remove last empty part
            .map(q => q.trim() + '?')
            .filter(q => q.length > 1);
    } else {
        // Single question or unclear format
        questions = [questionsContent.trim()];
    }

    // Clean up questions
    questions = questions
        .filter(q => q.length > 10) // Filter out very short strings
        .map(q => q.replace(/^[^\w]*/, '').trim()); // Remove leading non-word characters

    if (questions.length === 0) {
        throw new Error("No valid questions found in the content");
    }

    return questions;
}

/**
 * Selects a random subset of questions from the available questions
 * @param {string[]} questions - Available questions
 * @param {number} num - Number of questions to select
 * @returns {string[]} Array of selected questions
 */
function selectRandomQuestions(questions, num) {
    if (questions.length <= num) {
        return [...questions]; // Return all questions if we don't have enough
    }

    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, num);
}

// In-memory map to store the session state for each lab session.
const sessionStateMap = new Map(); // Map<labId: string, sessionState: object>

/**
 * Session state structure:
 * {
 * questions: string[],            // Selected questions for this session
 * currentQuestionIndex: number,  // Index of current question (0-based)
 * totalQuestions: number,        // Total number of questions to ask
 * responses: string[],            // User responses to each question
 * phase: 'greeting' | 'questioning' | 'complete',
 * labName: string,                // Name of the lab
 * labDescription: string,         // Description of the lab
 * allAvailableQuestions: string[] // All questions from the file
 * }
 */

/**
 * Clears the session state for a given lab ID
 * @param {string} labId - The lab ID to clear session for
 */
export function clearEvaluationSession(labId) {
    sessionStateMap.delete(labId);
}

/**
 * Manages a self-evaluation chat session with the Gemini LLM directly from the client (browser).
 * It follows a structured flow: greeting -> question 1 -> feedback -> question 2 -> feedback -> ... -> final evaluation
 *
 * @param {string} labId - A unique identifier for the current lab evaluation session.
 * @param {Array<{ sender: 'user' | 'llm'; text: string }>} chatHistory - The entire history of messages in the current session (excluding the current user message).
 * @param {string} userMessage - The latest message sent by the user in this turn.
 * @returns {Promise<{ llmResponse: string, conceptClarityScore: number | null, vivaScore: number | null, evaluationComplete: boolean, selectedQuestions: string[] }>}
 * - llmResponse: The text response generated by the Gemini bot.
 * - conceptClarityScore: The numeric score (1-3) for concept clarity if evaluation is complete, otherwise `null`.
 * - vivaScore: The numeric score (1-3) for viva performance if evaluation is complete, otherwise `null`.
 * - evaluationComplete: A boolean indicating whether the chatbot considers the conversation finished.
 * - selectedQuestions: An array of the specific questions chosen for this evaluation session.
 */
export async function handleGeminiEvaluationClient(
    labId,
    chatHistory,
    userMessage
) {
    // Check if API key exists and is not empty
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === "" || apiKey === "undefined") {
        return {
            llmResponse: "Evaluation service is not configured. Please check your API key in environment variables (NEXT_PUBLIC_GEMINI_API_KEY).",
            conceptClarityScore: null,
            vivaScore: null,
            evaluationComplete: false,
            selectedQuestions: []
        };
    }

    let llmResponse = "";
    let conceptClarityScore = null;
    let vivaScore = null;
    let evaluationComplete = false;
    let sessionState = sessionStateMap.get(labId);

    // Initialize session state if it doesn't exist
    if (!sessionState) {
        try {
            // Fetch lab details and questions directly
            const labData = await fetchLabDetailsAndQuestions(labId);

            const numQuestionsToAsk = Math.floor(Math.random() * 2) + 2; // Randomly 2 or 3 questions
            const selectedQuestions = selectRandomQuestions(labData.questionsArray, numQuestionsToAsk);

            sessionState = {
                questions: selectedQuestions,
                currentQuestionIndex: 0,
                totalQuestions: numQuestionsToAsk,
                responses: [],
                phase: 'greeting',
                labName: labData.labName,
                labDescription: labData.labDescription,
                allAvailableQuestions: labData.questionsArray
            };
            sessionStateMap.set(labId, sessionState);
        } catch (error) {
            console.error("Error initializing evaluation session:", error);
            return {
                llmResponse: `Error initializing evaluation: ${error.message}. Please ensure the questions are properly configured in the lab.`,
                conceptClarityScore: null,
                vivaScore: null,
                evaluationComplete: false,
                selectedQuestions: []
            };
        }
    }

    try {
        // Handle the greeting phase (first interaction)
        if (chatHistory.length === 0 && sessionState.phase === 'greeting') {
            llmResponse = `Hello! I'm your self-evaluation assistant for **${sessionState.labName}**.

I'll be asking you ${sessionState.totalQuestions} questions about your lab experience. After each response, I'll provide some feedback and then move on to the next question.

At the end, I'll provide you with two scores:
- **Concept Clarity Score**: Based on your understanding of the concepts and technical implementation
- **Viva Score**: Based on your ability to explain and communicate your work effectively

Let's start with the first question:

**Question 1:** ${sessionState.questions[0]}

Please take your time to provide a thoughtful response.`;

            sessionState.phase = 'questioning';
            sessionStateMap.set(labId, sessionState);

            return {
                llmResponse,
                conceptClarityScore,
                vivaScore,
                evaluationComplete,
                selectedQuestions: sessionState.questions
            };
        }

        // Handle questioning phase
        if (sessionState.phase === 'questioning') {
            // Store the user's response
            sessionState.responses.push(userMessage);

            // Create system instruction for providing feedback and potentially asking next question
            const currentQuestionIndex = sessionState.currentQuestionIndex;
            const isLastQuestion = currentQuestionIndex >= sessionState.totalQuestions - 1;

            let systemInstruction;

            if (isLastQuestion) {
                // This is the last question - provide feedback and complete evaluation
                systemInstruction = `You are an AI self-evaluation assistant for the coding lab: "${sessionState.labName}".

The user just answered their final question: "${sessionState.questions[currentQuestionIndex]}"
Their response was: "${userMessage}"

This was question ${currentQuestionIndex + 1} of ${sessionState.totalQuestions}.

Please:
1. Provide constructive feedback on their response (2-3 sentences max)
2. Give a brief overall summary of their evaluation performance
3. Assign TWO separate scores from 1 to 3 based on ALL their responses:

   **Concept Clarity Score (1-3):**
   - Score 1: Basic understanding, unclear explanations, limited grasp of technical concepts
   - Score 2: Decent understanding, reasonable explanations, good grasp of most concepts
   - Score 3: Excellent understanding, clear and detailed explanations, strong grasp of all concepts

   **Viva Score (1-3):**
   - Score 1: Poor communication, difficulty explaining work, unclear responses
   - Score 2: Good communication, able to explain most aspects clearly, organized responses
   - Score 3: Excellent communication, articulate explanations, well-structured and insightful responses

4. Format your scores exactly like this:
   CONCEPT_CLARITY_SCORE: [1-3]
   VIVA_SCORE: [1-3]

5. End with "EVALUATION_COMPLETE" on a new line

Keep your response encouraging but constructive. Focus on specific aspects of their answers.

All user responses for context:
${sessionState.responses.map((resp, idx) => `Question ${idx + 1}: ${sessionState.questions[idx]}\nResponse: ${resp}`).join('\n\n')}`;
            } else {
                // Provide feedback and ask next question
                systemInstruction = `You are an AI self-evaluation assistant for the coding lab: "${sessionState.labName}".

The user just answered: "${sessionState.questions[currentQuestionIndex]}"
Their response was: "${userMessage}"

This was question ${currentQuestionIndex + 1} of ${sessionState.totalQuestions}.

Please:
1. Provide constructive feedback on their response (2-3 sentences max). Be specific about what was good and what could be improved.
2. Then ask the next question: "${sessionState.questions[currentQuestionIndex + 1]}"

Format your response like this:
**Feedback:** [Your feedback here]

**Question ${currentQuestionIndex + 2}:** ${sessionState.questions[currentQuestionIndex + 1]}

Keep your feedback encouraging but constructive.`;
            }

            // Create chat with system instruction
            const chat = model.startChat({
                generationConfig: {
                    maxOutputTokens: 1000,
                    temperature: 0.7,
                    topP: 0.9,
                    topK: 40,
                }
            });

            const result = await chat.sendMessage(systemInstruction);
            const response = await result.response;
            const text = response.text();

            // Check if evaluation is complete
            if (text.includes("EVALUATION_COMPLETE")) {
                evaluationComplete = true;
                sessionState.phase = 'complete';

                // Extract concept clarity score
                const conceptMatch = text.match(/CONCEPT_CLARITY_SCORE:\s*(\d)/i);
                if (conceptMatch && conceptMatch[1]) {
                    const parsedScore = parseInt(conceptMatch[1], 10);
                    if (parsedScore >= 1 && parsedScore <= 3) {
                        conceptClarityScore = parsedScore;
                    }
                }

                // Extract viva score
                const vivaMatch = text.match(/VIVA_SCORE:\s*(\d)/i);
                if (vivaMatch && vivaMatch[1]) {
                    const parsedScore = parseInt(vivaMatch[1], 10);
                    if (parsedScore >= 1 && parsedScore <= 3) {
                        vivaScore = parsedScore;
                    }
                }

                console.log(`🎯 Evaluation Complete! Lab ID: ${labId}`);
                console.log(`📚 Concept Clarity Score: ${conceptClarityScore}/3`);
                console.log(`🗣️ Viva Score: ${vivaScore}/3`);

                // Clean up the response text
                llmResponse = text
                    .replace(/CONCEPT_CLARITY_SCORE:\s*\d/i, "")
                    .replace(/VIVA_SCORE:\s*\d/i, "")
                    .replace("EVALUATION_COMPLETE", "")
                    .trim();

                // Clean up session state as evaluation is complete
                sessionStateMap.delete(labId);
            } else {
                // Move to next question
                sessionState.currentQuestionIndex++;
                sessionStateMap.set(labId, sessionState);
                llmResponse = text;
            }
        }

    } catch (error) {
        console.error("Error communicating with Gemini API (Client-side):", error);

        // Provide more specific error messages
        if (error.message && error.message.includes('API_KEY')) {
            llmResponse = "Invalid API key. Please check your Gemini API key configuration.";
        } else if (error.message && error.message.includes('quota')) {
            llmResponse = "API quota exceeded. Please try again later or check your billing settings.";
        } else if (error.message && error.message.includes('blocked')) {
            llmResponse = "Content was blocked by safety filters. Please rephrase your response.";
        } else {
            llmResponse = `Evaluation service error: ${error.message || 'Unknown error'}. Please try again.`;
        }
    }

    return {
        llmResponse,
        conceptClarityScore,
        vivaScore,
        evaluationComplete,
        selectedQuestions: sessionState ? sessionState.questions : []
    };
}