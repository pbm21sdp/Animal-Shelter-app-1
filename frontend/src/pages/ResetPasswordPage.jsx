import { useState } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "../store/authStore";
import { useNavigate, useParams } from "react-router-dom";
import { Lock } from "lucide-react";
import toast from "react-hot-toast";

const ResetPasswordPage = () => {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const { resetPassword, error, isLoading, message } = useAuthStore();

    const { token } = useParams();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }
        try {
            await resetPassword(token, password);
            toast.success("Password reset successfully, redirecting to login page...");
            setTimeout(() => {
                navigate("/login");
            }, 2000);
        } catch (error) {
            console.error(error);
            toast.error(error.message || "Error resetting password");
        }
    };

    const inputStyle = {
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
                        Set new password
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
                        Choose a strong password for your account
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[
                        { id: 'password', label: 'New Password', value: password, onChange: (e) => setPassword(e.target.value) },
                        { id: 'confirm', label: 'Confirm Password', value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value) },
                    ].map(({ id, label, value, onChange }) => (
                        <div key={id}>
                            <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-muted)', marginBottom: '6px', fontWeight: 500 }}>
                                {label}
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: 'var(--color-muted)' }} />
                                <input
                                    id={id}
                                    type="password"
                                    placeholder="••••••••"
                                    value={value}
                                    onChange={onChange}
                                    required
                                    style={inputStyle}
                                    onFocus={(e) => e.target.style.borderColor = 'var(--color-accent)'}
                                    onBlur={(e) => e.target.style.borderColor = 'var(--color-blush)'}
                                />
                            </div>
                        </div>
                    ))}

                    {error && (
                        <div style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: '#FCE8E8', color: 'var(--color-error)', fontSize: '13px', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}
                    {message && (
                        <div style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: '#E8F5E9', color: '#2E7D32', fontSize: '13px', textAlign: 'center' }}>
                            {message}
                        </div>
                    )}

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
                        {isLoading ? "Resetting..." : "Set new password"}
                    </motion.button>
                </form>
            </motion.div>
        </div>
    );
};

export default ResetPasswordPage;
