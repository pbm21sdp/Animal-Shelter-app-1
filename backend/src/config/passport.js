import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import crypto from 'crypto';
import { User } from '../models/user.model.js';

passport.use(new GoogleStrategy(
    {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails?.[0]?.value;
            if (!email) {
                return done(new Error('No email returned from Google'), null);
            }

            let user = await User.findOne({ email });

            if (!user) {
                // Generate a random placeholder password — OAuth users never log in with a password
                const randomPassword = crypto.randomBytes(32).toString('hex');

                user = new User({
                    email,
                    name: profile.displayName,
                    avatar: profile.photos?.[0]?.value || null,
                    isVerified: true,
                    password: randomPassword,
                });
                await user.save();
            }

            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }
));

passport.serializeUser((user, done) => {
    done(null, user._id.toString());
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

export default passport;
