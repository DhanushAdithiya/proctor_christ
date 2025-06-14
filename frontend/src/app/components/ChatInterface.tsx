// components/ChatInterface.tsx

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Assuming shadcn/ui for avatars

interface ChatInterfaceProps {
    messages: { sender: 'user' | 'llm'; text: string }[];
    isThinking: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, isThinking }) => {
    return (
        <div className="flex flex-col space-y-4">
            {messages.map((msg, index) => (
                <div
                    key={index}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                    {msg.sender === 'llm' && (
                        <Avatar className="h-8 w-8 mr-2">
                            <AvatarImage src="/llm-avatar.png" alt="LLM" /> {/* Replace with your LLM avatar */}
                            <AvatarFallback>AI</AvatarFallback>
                        </Avatar>
                    )}
                    <div
                        className={`max-w-md p-3 rounded-lg ${
                            msg.sender === 'user'
                                ? 'bg-blue-500 text-white rounded-br-none'
                                : 'bg-gray-200 text-gray-800 rounded-bl-none'
                        }`}
                    >
                        {msg.text}
                    </div>
                    {msg.sender === 'user' && (
                        <Avatar className="h-8 w-8 ml-2">
                            <AvatarImage src="/user-avatar.png" alt="User" /> {/* Replace with user avatar */}
                            <AvatarFallback>You</AvatarFallback>
                        </Avatar>
                    )}
                </div>
            ))}
            {isThinking && (
                <div className="flex justify-start">
                    <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage src="/llm-avatar.png" alt="LLM" />
                        <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                    <div className="max-w-md p-3 rounded-lg bg-gray-200 text-gray-800 rounded-bl-none">
                        <div className="flex items-center space-x-1">
                            <span className="animate-pulse">.</span>
                            <span className="animate-pulse delay-75">.</span>
                            <span className="animate-pulse delay-150">.</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatInterface;