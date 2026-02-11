import { useState } from 'react';
import { login as apiLogin, register as apiRegister } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Mail, Lock, User, Building, BookOpen, ArrowRight } from 'lucide-react';

export default function AuthPage() {
    const { loginUser } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        email: '',
        password: '',
        fullName: '',
        university: '',
        department: '',
        enrollmentYear: '',
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let result;
            if (isLogin) {
                result = await apiLogin(form.email, form.password);
            } else {
                result = await apiRegister(form);
            }
            loginUser(result.token, result.user);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">
                    <div className="auth-logo-icon">
                        <GraduationCap size={28} color="white" />
                    </div>
                    <h2>Talk-to-Syllabus</h2>
                    <p>{isLogin ? 'Welcome back! Sign in to continue.' : 'Create your account to get started.'}</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="form-group">
                            <label className="form-label" htmlFor="fullName">Full Name</label>
                            <div style={{ position: 'relative' }}>
                                <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    id="fullName"
                                    className="form-input"
                                    style={{ paddingLeft: 36 }}
                                    type="text"
                                    name="fullName"
                                    placeholder="John Doe"
                                    value={form.fullName}
                                    onChange={handleChange}
                                    required={!isLogin}
                                />
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Email</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                id="email"
                                className="form-input"
                                style={{ paddingLeft: 36 }}
                                type="email"
                                name="email"
                                placeholder="you@university.edu"
                                value={form.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="password">Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                id="password"
                                className="form-input"
                                style={{ paddingLeft: 36 }}
                                type="password"
                                name="password"
                                placeholder="••••••••"
                                value={form.password}
                                onChange={handleChange}
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    {!isLogin && (
                        <>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label" htmlFor="university">University</label>
                                    <div style={{ position: 'relative' }}>
                                        <Building size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input
                                            id="university"
                                            className="form-input"
                                            style={{ paddingLeft: 36 }}
                                            type="text"
                                            name="university"
                                            placeholder="MIT"
                                            value={form.university}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="department">Department</label>
                                    <div style={{ position: 'relative' }}>
                                        <BookOpen size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input
                                            id="department"
                                            className="form-input"
                                            style={{ paddingLeft: 36 }}
                                            type="text"
                                            name="department"
                                            placeholder="Computer Science"
                                            value={form.department}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    <button
                        type="submit"
                        className="auth-submit"
                        disabled={loading}
                    >
                        {loading ? 'Please wait...' : (
                            <>
                                {isLogin ? 'Sign In' : 'Create Account'}
                                <ArrowRight size={16} style={{ marginLeft: 8, display: 'inline' }} />
                            </>
                        )}
                    </button>
                </form>

                <div className="auth-switch">
                    {isLogin ? (
                        <>Don&apos;t have an account? <a onClick={() => { setIsLogin(false); setError(''); }}>Sign Up</a></>
                    ) : (
                        <>Already have an account? <a onClick={() => { setIsLogin(true); setError(''); }}>Sign In</a></>
                    )}
                </div>
            </div>
        </div>
    );
}
