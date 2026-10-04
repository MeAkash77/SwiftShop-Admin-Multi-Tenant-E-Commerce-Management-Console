import dotenv from "dotenv";
dotenv.config();

const envConfig = {
    MONGODB_URL: process.env.MONGODB_URL,
    PORT: process.env.PORT,
    JWT_TOKEN_SECRET : process.env.JWT_TOKEN_SECRET,
    JWT_REFRESH_SECRET : process.env.JWT_REFRESH_SECRET,
    /** Short-lived access JWT (default 1 hour) */
    JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || "1h",
    /** Long-lived refresh JWT / cookie (default 30 days) */
    JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || "30d",
    CLIENT_URL :process.env.CLIENT_URL,
    ADMIN_SETUP_SECRET: process.env.ADMIN_SETUP_SECRET,
    /** Optional Redis (Docker / Upstash). Empty = cache skipped. */
    REDIS_URL: process.env.REDIS_URL || "",
    /** Mongo pool — higher under Docker; low on Vercel serverless. */
    MONGO_MAX_POOL: Number(process.env.MONGO_MAX_POOL) || (process.env.VERCEL ? 5 : 20),
}

export default envConfig;