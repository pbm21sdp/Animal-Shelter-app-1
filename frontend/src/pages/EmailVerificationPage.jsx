import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore";

const EmailVerificationPage = () => {
    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const inputRefs = useRef([]);
    const navigate = useNavigate();

    const { error, isLoading, verifyEmail } = useAuthStore();

    const handleChange = (index, value) => {
        const newCode = [...code];

        if (value.length > 1) {
            const pastedCode = value.slice(0, 6).split("");
            for (let i = 0; i < 6; i++) {
                newCode[i] = pastedCode[i] || "";
            }
            setCode(newCode);
            const lastFilledIndex = newCode.findLastIndex((digit) => digit !== "");
            const focusIndex = lastFilledIndex < 5 ? lastFilledIndex + 1 : 5;
            inputRefs.current[focusIndex].focus();
        } else {
            newCode[index] = value;
            setCode(newCode);
            if (value && index < 5) {
                inputRefs.current[index + 1].focus();
            }
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const verificationCode = code.join("");
        try {
            await verifyEmail(verificationCode);
            navigate("/");
            toast.success("Email verified successfully");
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        if (code.every((digit) => digit !== "")) {
            handleSubmit(new Event("submit"));
        }
    }, [code]);

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
                        One more step
                    </span>
                </div>

                <div className="text-center mb-7">
                    <h1 style={{ fontSize: '26px', fontWeight: 500, color: 'var(--color-dark)', marginBottom: '6px' }}>
                        Verify your email
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
                        Enter the 6-digit code sent to your email address
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                        {code.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                type="text"
                                maxLength="6"
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                style={{
                                    width: '48px',
                                    height: '52px',
                                    textAlign: 'center',
                                    fontSize: '20px',
                                    fontWeight: 600,
                                    borderRadius: '10px',
                                    border: '0.5px solid var(--color-blush)',
                                    backgroundColor: 'var(--color-surface)',
                                    color: 'var(--color-dark)',
                                    outline: 'none',
                                    transition: 'border-color 0.15s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--color-accent)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--color-blush)'}
                            />
                        ))}
                    </div>

                    {error && (
                        <div style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: '#FCE8E8', color: 'var(--color-error)', fontSize: '13px', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="submit"
                        disabled={isLoading || code.some((d) => !d)}
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '12px',
                            backgroundColor: (isLoading || code.some((d) => !d)) ? 'var(--color-blush)' : 'var(--color-dark)',
                            color: '#FDF8F5',
                            fontSize: '13px',
                            fontWeight: 500,
                            border: 'none',
                            cursor: (isLoading || code.some((d) => !d)) ? 'not-allowed' : 'pointer',
                            transition: 'background-color 0.15s'
                        }}
                    >
                        {isLoading ? "Verifying..." : "Verify email"}
                    </motion.button>
                </form>
            </motion.div>
        </div>
    );
};

export default EmailVerificationPage;
