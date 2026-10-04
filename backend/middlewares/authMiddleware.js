/**
 * Auth middleware — JWT Bearer → req.user { id, role }; authorize(...roles) for RBAC.
 * See docs/01-SYSTEM-DESIGN.md (security) and docs/04-API-MODULES.md.
 */
import jwt from "jsonwebtoken";
import envConfig from "../configs/envConfig.js";

/** Verify access token and attach user to request. */
//Authenticate
export const authenticate = (req, res, next) => {
    try {
        const bearerToken = req.headers.authorization;

        if (!bearerToken || !bearerToken.startsWith('Bearer')) {
            return res.status(401).json({
                success: false,
                message: "Bearer token is missing"
            });
        }
        const token = bearerToken.split('Bearer ')[1];
        const decodedToken = jwt.verify(token, envConfig.JWT_TOKEN_SECRET);
        req.user = decodedToken;
        next();
    } catch (err) {
        return res.status(401).json({
            message: err.message
        });
    }
};


//Authorize
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Access denied"
            });
        }
        next();
    }
};

//verifyAccessToken For Changing Password
export const verifyAccessToken = (req,res,next) => {
    try {

        const authHeader =
            req.headers.authorization;

        if (!authHeader ||
            !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Access token required"
            });
        }

        const token =
            authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            envConfig.JWT_TOKEN_SECRET
        );

        req.user = decoded;

        next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid token"
        });
    }
};