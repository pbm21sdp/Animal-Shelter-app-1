const PasswordCriteria = ({ password }) => {
    const criteria = [
        { label: "At least 6 characters", met: password.length >= 6 },
        { label: "Contains uppercase letter", met: /[A-Z]/.test(password) },
        { label: "Contains lowercase letter", met: /[a-z]/.test(password) },
        { label: "Contains a number", met: /\d/.test(password) },
        { label: "Contains special character", met: /[^A-Za-z0-9]/.test(password) },
    ];

    return (
        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {criteria.map((item) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px' }}>
                    <span
                        style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '50%',
                            backgroundColor: item.met ? '#A8C5A0' : '#E8D4C8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            transition: 'background-color 0.2s'
                        }}
                    >
                        {item.met && (
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                <path d="M1.5 4L3.2 5.7L6.5 2.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        )}
                    </span>
                    <span style={{ color: 'var(--color-muted)' }}>{item.label}</span>
                </div>
            ))}
        </div>
    );
};

const PasswordStrengthMeter = ({ password }) => {
    const getStrength = (pass) => {
        let strength = 0;
        if (pass.length >= 6) strength++;
        if (pass.match(/[a-z]/) && pass.match(/[A-Z]/)) strength++;
        if (pass.match(/\d/)) strength++;
        if (pass.match(/[^a-zA-Z\d]/)) strength++;
        return strength;
    };

    const strength = getStrength(password);

    const getStrengthText = (strength) => {
        if (strength === 0) return "Very weak";
        if (strength === 1) return "Weak";
        if (strength === 2) return "Fair";
        if (strength === 3) return "Good";
        return "Strong";
    };

    return (
        <div style={{ marginTop: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-muted)', fontWeight: 500 }}>
                    Password strength
                </span>
                <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                    {getStrengthText(strength)}
                </span>
            </div>

            <div style={{ display: 'flex', gap: '4px' }}>
                {[...Array(4)].map((_, index) => (
                    <div
                        key={index}
                        style={{
                            height: '3px',
                            flex: 1,
                            borderRadius: '2px',
                            backgroundColor: index < strength ? '#A8C5A0' : '#E8D4C8',
                            transition: 'background-color 0.2s'
                        }}
                    />
                ))}
            </div>

            <PasswordCriteria password={password} />
        </div>
    );
};

export default PasswordStrengthMeter;
