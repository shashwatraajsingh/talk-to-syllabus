import { supabase } from './supabase';

const API_BASE = '/api';

async function getHeaders() {
    // Get current Supabase session token
    const { data: { session } } = await supabase.auth.getSession();
    const headers = { 'Content-Type': 'application/json' };
    if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    return headers;
}

export async function getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: await getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch profile');
    return data;
}

// Documents
export async function getDocuments() {
    const res = await fetch(`${API_BASE}/documents`, { headers: await getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch documents');
    return data.documents;
}

export async function uploadDocument(formData) {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${API_BASE}/documents/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
}

export async function deleteDocument(id) {
    const res = await fetch(`${API_BASE}/documents/${id}`, {
        method: 'DELETE',
        headers: await getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Delete failed');
    return data;
}

// Chat
export async function createSession(title, documentId) {
    const res = await fetch(`${API_BASE}/chat/sessions`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify({ title, documentId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create session');
    return data.session;
}

export async function getSessions() {
    const res = await fetch(`${API_BASE}/chat/sessions`, { headers: await getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch sessions');
    return data.sessions;
}

export async function getMessages(sessionId) {
    const res = await fetch(`${API_BASE}/chat/sessions/${sessionId}/messages`, { headers: await getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch messages');
    return data.messages;
}

export async function sendMessage(sessionId, content) {
    const res = await fetch(`${API_BASE}/chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify({ content }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send message');
    return data;
}

export async function deleteSession(sessionId) {
    const res = await fetch(`${API_BASE}/chat/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: await getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete session');
    return data;
}

export async function submitFeedback(sessionId, messageId, rating, text) {
    const res = await fetch(`${API_BASE}/chat/sessions/${sessionId}/messages/${messageId}/feedback`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify({ rating, text }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit feedback');
    return data;
}
