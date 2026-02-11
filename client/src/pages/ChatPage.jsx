import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import ChatView from '../components/ChatView';
import UploadModal from '../components/UploadModal';
import {
    getSessions,
    createSession,
    getMessages,
    deleteSession as apiDeleteSession,
    getDocuments,
} from '../utils/api';

export default function ChatPage() {
    const { user } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [showUpload, setShowUpload] = useState(false);
    const [loading, setLoading] = useState(true);

    // Load sessions and documents on mount
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [sessionsData, docsData] = await Promise.all([
                getSessions(),
                getDocuments(),
            ]);
            setSessions(sessionsData);
            setDocuments(docsData);

            // Auto-select last active session
            if (sessionsData.length > 0 && !activeSessionId) {
                selectSession(sessionsData[0].id);
            }
        } catch (err) {
            console.error('Failed to load data:', err);
        } finally {
            setLoading(false);
        }
    };

    const selectSession = async (sessionId) => {
        setActiveSessionId(sessionId);
        try {
            const msgs = await getMessages(sessionId);
            setMessages(msgs);
        } catch (err) {
            console.error('Failed loading messages:', err);
            setMessages([]);
        }
    };

    const handleNewChat = async () => {
        try {
            // Use the first completed document if available
            const completedDoc = documents.find(d => d.processing_status === 'completed');
            const session = await createSession(
                'New Chat',
                completedDoc?.id || null
            );
            setSessions((prev) => [session, ...prev]);
            setActiveSessionId(session.id);
            setMessages([]);
        } catch (err) {
            console.error('Failed to create session:', err);
        }
    };

    const handleDeleteSession = async (sessionId) => {
        try {
            await apiDeleteSession(sessionId);
            setSessions((prev) => prev.filter((s) => s.id !== sessionId));
            if (activeSessionId === sessionId) {
                setActiveSessionId(null);
                setMessages([]);
            }
        } catch (err) {
            console.error('Failed to delete session:', err);
        }
    };

    const handleMessageSent = useCallback((userText, result, error) => {
        // Add user message to local state
        const userMsg = {
            tempId: 'user-' + Date.now(),
            role: 'user',
            content: userText,
            created_at: new Date().toISOString(),
        };

        if (result && result.message) {
            // Add both user and AI messages
            const aiMsg = {
                ...result.message,
                sources: result.sources || [],
            };
            setMessages((prev) => [...prev, userMsg, aiMsg]);

            // Update session in sidebar
            setSessions((prev) =>
                prev.map((s) =>
                    s.id === activeSessionId
                        ? {
                            ...s,
                            message_count: (s.message_count || 0) + 2,
                            last_message_at: new Date().toISOString(),
                            title: s.title === 'New Chat' ? userText.slice(0, 50) : s.title,
                        }
                        : s
                )
            );
        } else if (error) {
            // Add user message and error response
            const errorMsg = {
                tempId: 'error-' + Date.now(),
                role: 'assistant',
                content: `Sorry, I encountered an error: ${error}. Please try again.`,
                created_at: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, userMsg, errorMsg]);
        }
    }, [activeSessionId]);

    const handleUploaded = () => {
        loadData();
    };

    const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

    return (
        <div className="app-layout">
            <Sidebar
                sessions={sessions}
                activeSessionId={activeSessionId}
                onSelectSession={selectSession}
                onNewChat={handleNewChat}
                onDeleteSession={handleDeleteSession}
                collapsed={sidebarCollapsed}
                documents={documents}
            />

            <ChatView
                session={activeSession}
                messages={messages}
                onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
                sidebarCollapsed={sidebarCollapsed}
                onOpenUpload={() => setShowUpload(true)}
                onMessageSent={handleMessageSent}
                documents={documents}
            />

            {showUpload && (
                <UploadModal
                    onClose={() => setShowUpload(false)}
                    onUploaded={handleUploaded}
                />
            )}
        </div>
    );
}
