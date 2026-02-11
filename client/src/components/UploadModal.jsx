import { useState, useRef } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { uploadDocument } from '../utils/api';

export default function UploadModal({ onClose, onUploaded }) {
    const [file, setFile] = useState(null);
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const [form, setForm] = useState({
        title: '',
        description: '',
        courseName: '',
        courseCode: '',
        semester: '',
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = () => setDragging(false);

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped && dropped.type === 'application/pdf') {
            setFile(dropped);
            if (!form.title) {
                setForm({ ...form, title: dropped.name.replace('.pdf', '') });
            }
        } else {
            setError('Only PDF files are supported.');
        }
    };

    const handleFileSelect = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            if (!form.title) {
                setForm({ ...form, title: selected.name.replace('.pdf', '') });
            }
        }
    };

    const handleSubmit = async () => {
        if (!file) return setError('Please select a PDF file.');
        if (!form.title.trim()) return setError('Title is required.');

        setUploading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('title', form.title);
            formData.append('description', form.description);
            formData.append('courseName', form.courseName);
            formData.append('courseCode', form.courseCode);
            formData.append('semester', form.semester);

            await uploadDocument(formData);
            onUploaded();
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">Upload Syllabus PDF</h3>
                    <button className="modal-close" onClick={onClose} aria-label="Close modal">
                        <X size={20} />
                    </button>
                </div>

                {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

                {/* Drop zone */}
                {!file ? (
                    <div
                        className={`upload-zone ${dragging ? 'dragging' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        role="button"
                        tabIndex={0}
                        aria-label="Upload PDF file"
                    >
                        <div className="upload-zone-icon">
                            <Upload size={36} />
                        </div>
                        <div className="upload-zone-text">
                            Drag & drop your PDF here, or <span style={{ color: 'var(--primary-light)', fontWeight: 700 }}>browse</span>
                        </div>
                        <div className="upload-zone-hint">PDF files up to 20MB</div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="application/pdf"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                            aria-hidden="true"
                        />
                    </div>
                ) : (
                    <div className="selected-file">
                        <FileText size={18} />
                        <span>{file.name}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({formatSize(file.size)})</span>
                        <button className="selected-file-remove" onClick={() => setFile(null)} aria-label="Remove file">
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* Form fields */}
                <div className="form-group">
                    <label className="form-label" htmlFor="upload-title">Title *</label>
                    <input
                        id="upload-title"
                        className="form-input"
                        name="title"
                        placeholder="e.g. CS301 Data Structures Syllabus"
                        value={form.title}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="upload-desc">Description</label>
                    <input
                        id="upload-desc"
                        className="form-input"
                        name="description"
                        placeholder="Brief description (optional)"
                        value={form.description}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label" htmlFor="upload-course">Course Name</label>
                        <input
                            id="upload-course"
                            className="form-input"
                            name="courseName"
                            placeholder="Data Structures"
                            value={form.courseName}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="upload-code">Course Code</label>
                        <input
                            id="upload-code"
                            className="form-input"
                            name="courseCode"
                            placeholder="CS301"
                            value={form.courseCode}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="upload-semester">Semester</label>
                    <input
                        id="upload-semester"
                        className="form-input"
                        name="semester"
                        placeholder="Spring 2026"
                        value={form.semester}
                        onChange={handleChange}
                    />
                </div>

                <button className="upload-btn" onClick={handleSubmit} disabled={uploading || !file}>
                    {uploading ? 'Uploading & Processing...' : 'Upload & Process'}
                </button>
            </div>
        </div>
    );
}
