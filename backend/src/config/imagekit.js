// backend/src/config/imagekit.js 
import ImageKit from "imagekit"; 
import { ENV } from "./env.js";

let imagekit;

try {
  imagekit = new ImageKit({ 
    publicKey: ENV.IMAGEKIT_PUBLIC_KEY, 
    privateKey: ENV.IMAGEKIT_PRIVATE_KEY, 
    urlEndpoint: ENV.IMAGEKIT_URL_ENDPOINT, 
  }); 
} catch (error) {
  console.error("Error initializing ImageKit:", error.message);
  throw error; // Or handle gracefully depending on requirements
}

export default imagekit;