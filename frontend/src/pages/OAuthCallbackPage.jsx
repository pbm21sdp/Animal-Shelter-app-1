import { useEffect } from 'react';

const OAuthCallbackPage = () => {
    useEffect(() => {
        const channel = new BroadcastChannel('paws_oauth');
        channel.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' });
        channel.close();
        window.close();
    }, []);

    return null;
};

export default OAuthCallbackPage;
