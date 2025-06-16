import { useState, useRef, useEffect } from 'react';

const FinancialAssistant = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: "Hi! I'm your personal finance assistant. Ask me about your spending, categories, or any financial insights!",
            sender: 'bot',
            timestamp: new Date()
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;

        const userMessage = {
            id: Date.now(),
            text: inputText,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        const currentMessage = inputText;
        setInputText('');
        setIsTyping(true);

        try {
            // Get auth token
            const token = localStorage.getItem('token');

            if (!token) {
                throw new Error('No authentication token found');
            }

            console.log('Sending chat message:', currentMessage);

            const response = await fetch('http://localhost:5000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: currentMessage
                })
            });

            console.log('Chat response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Chat API error:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Chat response data:', data);

            const botMessage = {
                id: Date.now() + 1,
                text: data.response,
                sender: 'bot',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMessage]);
            setIsTyping(false);

        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage = {
                id: Date.now() + 1,
                text: "Sorry, I'm having trouble connecting to the financial data right now. Please try again in a moment.",
                sender: 'bot',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
            setIsTyping(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const formatTime = (timestamp) => {
        return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const suggestedQuestions = [
        "How much did I spend this month?",
        "What's my biggest expense category?",
        "Show me my recent transactions",
        "What are my spending patterns?"
    ];

    // Inline styles to avoid CSS conflicts
    const chatButtonStyle = {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '56px',
        height: '56px',
        backgroundColor: '#2563eb',
        color: 'white',
        border: 'none',
        borderRadius: '50%',
        cursor: 'pointer',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        transition: 'all 0.3s ease',
        outline: 'none'
    };

    const chatPanelStyle = {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '384px',
        height: '600px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        fontFamily: 'system-ui, -apple-system, sans-serif'
    };

    return (
        <>
            {/* Chat Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    style={chatButtonStyle}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#1d4ed8';
                        e.target.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#2563eb';
                        e.target.style.transform = 'scale(1)';
                    }}
                >
                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                </button>
            )}

            {/* Chat Panel */}
            {isOpen && (
                <div style={chatPanelStyle}>
                    {/* Header */}
                    <div style={{
                        backgroundColor: '#2563eb',
                        color: 'white',
                        padding: '16px',
                        borderTopLeftRadius: '8px',
                        borderTopRightRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                backgroundColor: '#3b82f6',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontWeight: '600', fontSize: '16px' }}>Financial Assistant</h3>
                                <p style={{ margin: 0, color: '#bfdbfe', fontSize: '14px' }}>Online</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#bfdbfe',
                                cursor: 'pointer',
                                padding: '4px'
                            }}
                            onMouseEnter={(e) => e.target.style.color = 'white'}
                            onMouseLeave={(e) => e.target.style.color = '#bfdbfe'}
                        >
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Messages */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px'
                    }}>
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                style={{
                                    display: 'flex',
                                    justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start'
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '8px',
                                    maxWidth: '80%',
                                    flexDirection: message.sender === 'user' ? 'row-reverse' : 'row'
                                }}>
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        backgroundColor: message.sender === 'user' ? '#2563eb' : '#e5e7eb',
                                        color: message.sender === 'user' ? 'white' : '#6b7280'
                                    }}>
                                        {message.sender === 'user' ? (
                                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                            </svg>
                                        ) : (
                                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                    <div style={{
                                        borderRadius: '8px',
                                        padding: '12px',
                                        backgroundColor: message.sender === 'user' ? '#2563eb' : '#f3f4f6',
                                        color: message.sender === 'user' ? 'white' : '#1f2937'
                                    }}>
                                        <p style={{ margin: 0, fontSize: '14px', whiteSpace: 'pre-wrap' }}>{message.text}</p>
                                        <p style={{
                                            margin: '4px 0 0 0',
                                            fontSize: '12px',
                                            color: message.sender === 'user' ? '#bfdbfe' : '#6b7280'
                                        }}>
                                            {formatTime(message.timestamp)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Typing Indicator */}
                        {isTyping && (
                            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        backgroundColor: '#e5e7eb',
                                        color: '#6b7280',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div style={{
                                        backgroundColor: '#f3f4f6',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        display: 'flex',
                                        gap: '4px'
                                    }}>
                                        <div style={{
                                            width: '8px',
                                            height: '8px',
                                            backgroundColor: '#9ca3af',
                                            borderRadius: '50%',
                                            animation: 'bounce 1.4s infinite ease-in-out'
                                        }}></div>
                                        <div style={{
                                            width: '8px',
                                            height: '8px',
                                            backgroundColor: '#9ca3af',
                                            borderRadius: '50%',
                                            animation: 'bounce 1.4s infinite ease-in-out 0.16s'
                                        }}></div>
                                        <div style={{
                                            width: '8px',
                                            height: '8px',
                                            backgroundColor: '#9ca3af',
                                            borderRadius: '50%',
                                            animation: 'bounce 1.4s infinite ease-in-out 0.32s'
                                        }}></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Suggested Questions */}
                    {messages.length <= 2 && (
                        <div style={{
                            padding: '8px 16px',
                            borderTop: '1px solid #f3f4f6'
                        }}>
                            <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 8px 0' }}>Try asking:</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {suggestedQuestions.map((question, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setInputText(question)}
                                        style={{
                                            border: 'none',
                                            background: 'none',
                                            textAlign: 'left',
                                            fontSize: '12px',
                                            color: '#2563eb',
                                            cursor: 'pointer',
                                            padding: '4px',
                                            borderRadius: '4px'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.backgroundColor = '#eff6ff';
                                            e.target.style.color = '#1d4ed8';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.backgroundColor = 'transparent';
                                            e.target.style.color = '#2563eb';
                                        }}
                                    >
                                        "{question}"
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input */}
                    <div style={{
                        padding: '16px',
                        borderTop: '1px solid #e5e7eb'
                    }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask about your finances..."
                                disabled={isTyping}
                                style={{
                                    flex: 1,
                                    padding: '8px 12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    outline: 'none',
                                    fontFamily: 'inherit'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#2563eb';
                                    e.target.style.boxShadow = '0 0 0 2px rgba(37, 99, 235, 0.2)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#d1d5db';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!inputText.trim() || isTyping}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: !inputText.trim() || isTyping ? '#d1d5db' : '#2563eb',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: !inputText.trim() || isTyping ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                onMouseEnter={(e) => {
                                    if (!inputText.trim() || isTyping) return;
                                    e.target.style.backgroundColor = '#1d4ed8';
                                }}
                                onMouseLeave={(e) => {
                                    if (!inputText.trim() || isTyping) return;
                                    e.target.style.backgroundColor = '#2563eb';
                                }}
                            >
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CSS Animation for typing dots */}
            <style jsx>{`
                @keyframes bounce {
                    0%, 80%, 100% {
                        transform: scale(0);
                    } 40% {
                        transform: scale(1);
                    }
                }
            `}</style>
        </>
    );
};

export default FinancialAssistant;