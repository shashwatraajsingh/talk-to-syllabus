import { GraduationCap, Plus, MessageSquare, Trash2, LogOut, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({
    sessions,
    activeSessionId,
    onSelectSession,
    onNewChat,
    onDeleteSession,
    collapsed,
    documents,
}) {
    const { user, logout } = useAuth();

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
            {/* Header */}
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">
                        <GraduationCap size={20} />
                    </div>
                    <h1>Talk-to-Syllabus</h1>
                </div>
            </div>

            {/* New Chat Button */}
            <button className="new-chat-btn" onClick={onNewChat} aria-label="Start new chat">
                <Plus size={18} />
                New Chat
            </button>

            {/* Documents count */}
            {documents && documents.length > 0 && (
                <div className="sidebar-section-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                    <FileText size={12} />
                    {documents.length} Document{documents.length !== 1 ? 's' : ''} Uploaded
                </div>
            )}

            {/* Sessions List */}
            <div className="sidebar-section-label" style={{ marginTop: 8 }}>Recent Chats</div>
            <div className="session-list">
                {sessions.length === 0 && (
                    <div style={{
                        padding: '24px 16px',
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        fontSize: '0.8rem',
                        lineHeight: 1.6,
                    }}>
                        No conversations yet.<br />Start a new chat to begin!
                    </div>
                )}
                {sessions.map((session) => (
                    <div
                        key={session.id}
                        className={`session-item ${session.id === activeSessionId ? 'active' : ''}`}
                        onClick={() => onSelectSession(session.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && onSelectSession(session.id)}
                        aria-label={`Chat: ${session.title}`}
                    >
                        <MessageSquare size={16} className="session-item-icon" />
                        <span className="session-item-text">
                            {session.title || 'Untitled Chat'}
                        </span>
                        <button
                            className="session-item-delete"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSession(session.id);
                            }}
                            aria-label={`Delete chat: ${session.title}`}
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>

            {/* User footer */}
            <div className="sidebar-footer">
                <div className="user-avatar">
                    {getInitials(user?.fullName)}
                </div>
                <div className="user-info">
                    <div className="user-name">{user?.fullName || 'Student'}</div>
                    <div className="user-email">{user?.email || ''}</div>
                </div>
                <button
                    className="header-action-btn"
                    onClick={logout}
                    aria-label="Sign out"
                    title="Sign out"
                >
                    <LogOut size={18} />
                </button>
            </div>
        </aside>
    );
}
