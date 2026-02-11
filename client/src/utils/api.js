const API_BASE = '/api';

function getHeaders() {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

export async function login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
}

export async function register({ email, password, fullName, university, department, enrollmentYear }) {
    const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, university, department, enrollmentYear }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
}

export async function getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch profile');
    return data;
}

// Documents
export async function getDocuments() {
    const res = await fetch(`${API_BASE}/documents`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch documents');
    return data.documents;
}

export async function uploadDocument(formData) {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/documents/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
}

export async function deleteDocument(id) {
    const res = await fetch(`${API_BASE}/documents/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Delete failed');
    return data;
}

// Chat
export async function createSession(title, documentId) {
    const res = await fetch(`${API_BASE}/chat/sessions`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ title, documentId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create session');
    return data.session;
}

export async function getSessions() {
    const res = await fetch(`${API_BASE}/chat/sessions`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch sessions');
    return data.sessions;
}

export async function getMessages(sessionId) {
    const res = await fetch(`${API_BASE}/chat/sessions/${sessionId}/messages`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch messages');
    return data.messages;
}

export async function sendMessage(sessionId, content) {
    const res = await fetch(`${API_BASE}/chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ content }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send message');
    return data;
}

export async function deleteSession(sessionId) {
    const res = await fetch(`${API_BASE}/chat/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete session');
    return data;
}

export async function submitFeedback(sessionId, messageId, rating, text) {
    const res = await fetch(`${API_BASE}/chat/sessions/${sessionId}/messages/${messageId}/feedback`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ rating, text }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit feedback');
    return data;
}
