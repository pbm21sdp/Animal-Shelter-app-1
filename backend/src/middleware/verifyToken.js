import jwt from "jsonwebtoken";

// Attaches userId if a valid token is present, but never blocks the request.
export const optionalVerifyToken = (req, res, next) => {
    const token = req.cookies.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (decoded) {
                req.userId = decoded.userId;
                req.isAdmin = decoded.isAdmin || false;
            }
        } catch { /* ignore invalid / expired tokens */ }
    }
    next();
};

export const verifyToken = (req, res, next) => {

    const token = req.cookies.token;

    if (!token){
        return res.status(401).json({success: false, message: "Unauthorized - no token provided"});
    }

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if(!decoded){
            return res.status(401).json({success: false, message: "Unauthorized - invalid token"});
        }

        req.userId = decoded.userId;
        req.isAdmin = decoded.isAdmin || false;
        next();

    }catch (error) {
        console.log("Error in verifyToken", error);
        return res.status(500).json({success: false, message: "Server error"});
    }
};