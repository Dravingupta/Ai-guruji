import { getAuth } from 'firebase-admin/auth';

export const createTokenVerifier = (verifyIdToken = token => getAuth().verifyIdToken(token)) => async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1];

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decodedToken = await verifyIdToken(token);
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
        };
        next();
    } catch (error) {
        console.error('Token verification error:', error.message);
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

export const verifyToken = createTokenVerifier();
