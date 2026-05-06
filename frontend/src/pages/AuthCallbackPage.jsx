import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function AuthCallbackPage() {
    const navigate = useNavigate();
    const { checkAuth } = useAuthStore();

    useEffect(() => {
        checkAuth().then(() => {
            navigate('/', { replace: true });
        });
    }, []);

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FDF8F5',
        }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{
                    width: '32px',
                    height: '32px',
                    border: '2px solid #E8D4C8',
                    borderTop: '2px solid #C07A4A',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    margin: '0 auto 16px',
                }} />
                <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '13px',
                    color: '#9C7B6A',
                }}>
                    Signing you in…
                </p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        </div>
    );
}
