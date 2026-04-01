import { motion } from "framer-motion";
import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import { ArrowLeft, Loader, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);

    const { isLoading, forgotPassword } = useAuthStore();

    const handleSubmit = async (e) => {
        e.preventDefault();
        await forgotPassword(email);
        setIsSubmitted(true);
    };

    return (
        <div
            className="min-h-screen w-full flex items-center justify-center px-4"
            style={{ backgroundColor: 'var(--color-bg)' }}
        >
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full"
                style={{ maxWidth: '400px' }}
            >
                {/* Tag pill */}
                <div className="flex justify-center mb-6">
                    <span style={{ backgroundColor: '#FDEADE', color: 'var(--color-accent)', fontSize: '11px', borderRadius: '20px', padding: '4px 14px', fontWeight: 500 }}>
                        Password reset
                    </span>
                </div>

                <div className="text-center mb-7">
                    <h1 style={{ fontSize: '26px', fontWeight: 500, color: 'var(--color-dark)', marginBottom: '6px' }}>
                        Forgot password?
                    </h1>
                    {!isSubmitted && (
                        <p style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
                            Enter your email and we'll send you a reset link
                        </p>
                    )}
                </div>

                {!isSubmitted ? (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-muted)', marginBottom: '6px', fontWeight: 500 }}>
                                Email
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Mail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: 'var(--color-muted)' }} />
                                <input
                                    type="email"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    style={{
                                        width: '100%',
                                        paddingLeft: '40px',
                                        paddingRight: '14px',
                                        paddingTop: '10px',
                                        paddingBottom: '10px',
                                        borderRadius: '10px',
                                        border: '0.5px solid var(--color-blush)',
                                        backgroundColor: 'var(--color-surface)',
                                        color: 'var(--color-dark)',
                                        fontSize: '13px',
                                        outline: 'none',
                                        transition: 'border-color 0.15s'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = 'var(--color-accent)'}
                                    onBlur={(e) => e.target.style.borderColor = 'var(--color-blush)'}
                                />
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            type="submit"
                            disabled={isLoading}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '12px',
                                backgroundColor: isLoading ? 'var(--color-muted)' : 'var(--color-dark)',
                                color: '#FDF8F5',
                                fontSize: '13px',
                                fontWeight: 500,
                                border: 'none',
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                transition: 'background-color 0.15s'
                            }}
                        >
                            {isLoading ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : "Send reset link"}
                        </motion.button>
                    </form>
                ) : (
                    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            style={{
                                width: '52px',
                                height: '52px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--color-accent)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <Mail style={{ width: '22px', height: '22px', color: '#FDF8F5' }} />
                        </motion.div>
                        <p style={{ fontSize: '13px', color: 'var(--color-muted)', lineHeight: '1.6' }}>
                            If an account exists for <strong style={{ color: 'var(--color-dark)', fontWeight: 500 }}>{email}</strong>, you will receive a password reset link shortly.
                        </p>
                    </div>
                )}

                <div style={{ textAlign: 'center', marginTop: '28px' }}>
                    <Link
                        to="/login"
                        style={{ fontSize: '12px', color: 'var(--color-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-accent)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-muted)'}
                    >
                        <ArrowLeft style={{ width: '13px', height: '13px' }} />
                        Back to login
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPasswordPage;
