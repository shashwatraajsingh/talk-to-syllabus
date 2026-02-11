import { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import {
    PanelLeftClose,
    PanelLeftOpen,
    Upload,
    BookOpen,
    Send,
    GraduationCap,
    Sparkles,
    FileText,
    Calendar,
    ClipboardList,
    HelpCircle,
} from 'lucide-react';
import { sendMessage as apiSendMessage } from '../utils/api';

export default function ChatView({
    session,
    messages,
    onToggleSidebar,
    sidebarCollapsed,
    onOpenUpload,
    onMessageSent,
    documents,
}) {
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [btechYear, setBtechYear] = useState('1'); // BTech year selector
    const [showWelcome, setShowWelcome] = useState(false); // Welcome popup
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    // Show welcome popup for new sessions
    useEffect(() => {
        if (session && messages.length === 0) {
            setShowWelcome(true);
        }
    }, [session, messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, sending]);

    // Auto-resize textarea
    useEffect(() => {
        const el = textareaRef.current;
        if (el) {
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 150) + 'px';
        }
    }, [input]);

    const handleSend = async () => {
        if (!input.trim() || sending || !session) return;

        const userMessage = input.trim();
        setInput('');
        setSending(true);

        try {
            const result = await apiSendMessage(session.id, userMessage);
            onMessageSent(userMessage, result);
        } catch (err) {
            console.error('Failed to send:', err);
            onMessageSent(userMessage, null, err.message);
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSuggestionClick = (text) => {
        setInput(text);
        textareaRef.current?.focus();
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const suggestions = [
        {
            icon: <Calendar size={20} />,
            title: 'Exam Schedule',
            desc: 'When is the midterm and what does it cover?',
            query: 'When is the midterm exam and what topics does it cover?',
        },
        {
            icon: <ClipboardList size={20} />,
            title: 'Grading Policy',
            desc: 'How is my final grade calculated?',
            query: 'What is the grading policy and how is the final grade calculated?',
        },
        {
            icon: <BookOpen size={20} />,
            title: 'Course Topics',
            desc: 'What are the main topics covered?',
            query: 'What are the main topics and learning objectives of this course?',
        },
        {
            icon: <HelpCircle size={20} />,
            title: 'Prerequisites',
            desc: 'What do I need to know before this course?',
            query: 'What are the prerequisites for this course?',
        },
    ];

    const activeDoc = documents?.find(d => d.id === session?.document_id);

    return (
        <div className="main-area">
            {/* Header */}
            <div className="chat-header">
                <div className="chat-header-left">
                    <button
                        className="toggle-sidebar-btn"
                        onClick={onToggleSidebar}
                        aria-label={sidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}
                    >
                        {sidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
                    </button>
                    <div>
                        <div className="chat-header-title">
                            {session ? (session.title || 'New Chat') : 'Talk-to-Syllabus'}
                        </div>
                        {activeDoc && (
                            <div className="chat-header-subtitle">
                                Chatting with: {activeDoc.title}
                            </div>
                        )}
                    </div>
                </div>
                <div className="chat-header-actions">
                    {activeDoc && (
                        <div className="doc-selector">
                            <span className="doc-selector-dot" />
                            {activeDoc.course_code || 'Document'}
                        </div>
                    )}
                    <button className="header-action-btn" onClick={onOpenUpload} aria-label="Upload document" title="Upload PDF">
                        <Upload size={18} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="messages-container">
                <div className="messages-inner">
                    {(!session || messages.length === 0) && !sending ? (
                        /* Welcome State */
                        <div className="welcome-state">
                            <div className="welcome-icon">
                                <GraduationCap size={38} />
                            </div>
                            <h2 className="welcome-title">What would you like to know?</h2>
                            <p className="welcome-subtitle">
                                Upload your course syllabus and ask anything — exam dates, grading policies, topics covered, and more.
                                Your AI study companion is ready.
                            </p>
                            <div className="suggestion-grid">
                                {suggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        className="suggestion-card"
                                        onClick={() => handleSuggestionClick(s.query)}
                                    >
                                        <div className="suggestion-card-icon">{s.icon}</div>
                                        <div className="suggestion-card-title">{s.title}</div>
                                        <div className="suggestion-card-desc">{s.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            {messages.map((msg) => (
                                <div key={msg.id || msg.tempId} className={`message ${msg.role}`}>
                                    <div className="message-avatar">
                                        {msg.role === 'assistant' ? (
                                            <Sparkles size={16} />
                                        ) : (
                                            'U'
                                        )}
                                    </div>
                                    <div className="message-content">
                                        <div className="message-bubble">
                                            {msg.role === 'assistant' ? (
                                                <Markdown>{msg.content}</Markdown>
                                            ) : (
                                                msg.content
                                            )}
                                        </div>
                                        {/* Source tags for AI messages */}
                                        {msg.sources && msg.sources.length > 0 && (
                                            <div className="message-sources">
                                                {msg.sources.map((src, i) => (
                                                    <span key={i} className="source-tag">
                                                        <FileText size={10} />
                                                        {src.documentTitle}{src.pageNumber ? ` p.${src.pageNumber}` : ''}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <div className="message-timestamp">{formatTime(msg.created_at)}</div>
                                    </div>
                                </div>
                            ))}

                            {/* Typing indicator */}
                            {sending && (
                                <div className="message assistant">
                                    <div className="message-avatar">
                                        <Sparkles size={16} />
                                    </div>
                                    <div className="message-content">
                                        <div className="message-bubble">
                                            <div className="typing-indicator">
                                                <div className="typing-dot" />
                                                <div className="typing-dot" />
                                                <div className="typing-dot" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input */}
            <div className="input-area">
                <div className="input-wrapper">
                    {/* BTech Year Selector */}
                    <div className="year-selector">
                        <span className="year-selector-label">
                            <GraduationCap size={16} />
                            BTech Year:
                        </span>
                        <div className="year-selector-options">
                            {['1', '2', '3', '4'].map(year => (
                                <button
                                    key={year}
                                    className={`year-option ${btechYear === year ? 'active' : ''}`}
                                    onClick={() => setBtechYear(year)}
                                    aria-label={`Select year ${year}`}
                                >
                                    {year}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="input-container">
                        <textarea
                            ref={textareaRef}
                            className="chat-input"
                            placeholder={session ? 'Ask about your syllabus...' : 'Start a new chat first...'}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={!session || sending}
                            rows={1}
                            aria-label="Type your message"
                        />
                        <div className="input-actions">
                            <button
                                className="send-btn"
                                onClick={handleSend}
                                disabled={!input.trim() || sending || !session}
                                aria-label="Send message"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                    <div className="input-hint">
                        Talk-to-Syllabus uses AI to answer from your uploaded documents. Always verify important details.
                    </div>
                </div>
            </div>

            {/* Welcome Popup */}
            {showWelcome && (
                <div className="modal-overlay" onClick={() => setShowWelcome(false)}>
                    <div className="welcome-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="welcome-icon">
                            <Sparkles size={32} />
                        </div>
                        <h2 className="welcome-title">Welcome to Talk-to-Syllabus! 🎓</h2>
                        <div className="welcome-content">
                            <p className="welcome-message">
                                For now, please ask questions about:
                            </p>
                            <div className="welcome-topic">
                                <BookOpen size={20} />
                                <div>
                                    <strong>Unit-1: Cyber Security</strong>
                                    <br />
                                    <span className="welcome-subtitle">Introduction to Cybercrime</span>
                                </div>
                            </div>
                            <p className="welcome-footer">
                                📚 More units and topics coming soon!
                            </p>
                        </div>
                        <button className="welcome-btn" onClick={() => setShowWelcome(false)}>
                            Got it, Let's Start!
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
