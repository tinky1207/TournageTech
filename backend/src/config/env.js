// backend/src/config/env.js 
import dotenv from "dotenv"; 

dotenv.config(); 

export const ENV = { 
  PORT: process.env.PORT, 
  NODE_ENV: process.env.NODE_ENV, 
  DATABASE_URL: process.env.DATABASE_URL, 
  CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY, 
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY, 
  IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY, 
  IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY, 
  IMAGEKIT_URL_ENDPOINT: process.env.IMAGEKIT_URL_ENDPOINT, 
  ARCJET_KEY: process.env.ARCJET_KEY, 
  API_URL: process.env.API_URL, 
  CLERK_PEM_PUBLIC_KEY: process.env.CLERK_PEM_PUBLIC_KEY, 
}; 