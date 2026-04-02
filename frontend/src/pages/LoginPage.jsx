import { useState } from "react";
import { motion } from "framer-motion";
import { Loader, Lock, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import PeekingCats from "../components/PeekingCats";

const oauthButtonStyle = {
    width: '100%',
    padding: '10px',
    borderRadius: '10px',
    border: '0.5px solid #E8D4C8',
    backgroundColor: '#FFFAF7',
    color: '#5C3D2E',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
};

const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const { login, isLoading, error } = useAuthStore();

    const handleLogin = async (e) => {
        e.preventDefault();
        await login(email, password);
    };

    const handleGoogleLogin = () => {};
    const handleFacebookLogin = () => {};

    const inputStyle = {
        width: '100%',
        paddingLeft: '40px',
        paddingRight: '14px',
        paddingTop: '10px',
        paddingBottom: '10px',
        borderRadius: '10px',
        border: '0.5px solid #E8C4B0',
        backgroundColor: '#FFFAF7',
        color: '#5C3D2E',
        fontSize: '13px',
        outline: 'none',
        transition: 'border-color 0.2s ease',
    };

    return (
        <div
            className="min-h-screen w-full flex items-center justify-center px-4 py-16"
            style={{ backgroundColor: '#FDF8F5', position: 'relative' }}
        >
            <PeekingCats />
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full"
                style={{ maxWidth: '400px', position: 'relative', zIndex: 1 }}
            >
                {/* Tag pill */}
                <div className="flex justify-center mb-6">
                    <span style={{ backgroundColor: '#FDEADE', color: '#D4967A', fontSize: '11px', borderRadius: '20px', padding: '4px 14px', fontWeight: 500 }}>
                        Welcome back
                    </span>
                </div>

                {/* Title */}
                <div className="text-center mb-7">
                    <h1 style={{ fontSize: '26px', fontWeight: 500, color: '#5C3D2E', marginBottom: '6px' }}>
                        Sign in
                    </h1>
                    <p style={{ fontSize: '13px', color: '#9C7B6A' }}>
                        Continue your pet adoption journey
                    </p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Email */}
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#9C7B6A', marginBottom: '6px', fontWeight: 500 }}>
                            Email
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Mail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: '#9C7B6A' }} />
                            <input
                                type="email"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={inputStyle}
                                onFocus={(e) => e.target.style.borderColor = '#D4967A'}
                                onBlur={(e) => e.target.style.borderColor = '#E8C4B0'}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#9C7B6A', marginBottom: '6px', fontWeight: 500 }}>
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: '#9C7B6A' }} />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={inputStyle}
                                onFocus={(e) => e.target.style.borderColor = '#D4967A'}
                                onBlur={(e) => e.target.style.borderColor = '#E8C4B0'}
                            />
                        </div>
                    </div>

                    {/* Forgot password */}
                    <div style={{ textAlign: 'right', marginTop: '-8px' }}>
                        <Link
                            to="/forgot-password"
                            style={{ fontSize: '12px', color: '#D4967A', textDecoration: 'none' }}
                            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                        >
                            Forgot password?
                        </Link>
                    </div>

                    {/* Error */}
                    {error && (
                        <div style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: '#FCE8E8', color: '#C0392B', fontSize: '13px', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}

                    {/* Submit */}
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '12px',
                            backgroundColor: isLoading ? '#9C7B6A' : '#5C3D2E',
                            color: '#FDF8F5',
                            fontSize: '13px',
                            fontWeight: 500,
                            border: 'none',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            transition: 'background-color 0.15s',
                        }}
                    >
                        {isLoading ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : "Sign in"}
                    </motion.button>

                    {/* Divider */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '20px', marginBottom: '16px' }}>
                        <div style={{ flex: 1, height: '0.5px', backgroundColor: '#E8D4C8' }} />
                        <span style={{ fontSize: '12px', color: '#9C7B6A', whiteSpace: 'nowrap' }}>or continue with</span>
                        <div style={{ flex: 1, height: '0.5px', backgroundColor: '#E8D4C8' }} />
                    </div>

                    {/* Google */}
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        style={oauthButtonStyle}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#D4967A'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E8D4C8'}
                    >
                        <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                        </svg>
                        Continue with Google
                    </button>

                    {/* Facebook */}
                    <button
                        type="button"
                        onClick={handleFacebookLogin}
                        style={oauthButtonStyle}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#D4967A'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E8D4C8'}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        Continue with Facebook
                    </button>
                </form>

                {/* Footer */}
                <p style={{ textAlign: 'center', fontSize: '12px', color: '#9C7B6A', marginTop: '24px' }}>
                    No account yet?{" "}
                    <Link
                        to="/signup"
                        style={{ color: '#D4967A', fontWeight: 500, textDecoration: 'none' }}
                        onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                        onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                    >
                        Create one
                    </Link>
                </p>
            </motion.div>
        </div>
    );
};

export default LoginPage;
