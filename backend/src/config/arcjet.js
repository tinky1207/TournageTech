// backend/src/config/arcjet.js 
import arcjet, { tokenBucket, shield, detectBot } from "@arcjet/node"; 
import { ENV } from "./env.js"; 

let aj;

try {
  // initialize Arcjet with security rules 
  aj = arcjet({ 
    key: ENV.ARCJET_KEY, 
    characteristics: ["ip.src"], 
    rules: [ 
      // shield protects your app from common attacks e.g. SQL injection, XSS, CSRF attacks 
      shield({ mode: "LIVE" }), 

      // bot detection - block all bots except search engines 
      detectBot({ 
        mode: "LIVE", 
        allow: [ 
          "CATEGORY:SEARCH_ENGINE", 
          // allow legitimate search engine bots 
          // see full list at https://arcjet.com/bot-list 
        ], 
      }), 

      // rate limiting with token bucket algorithm 
      tokenBucket({ 
        mode: "LIVE", 
        refillRate: 10, // tokens added per interval 
        interval: 10, // interval in seconds (10 seconds) 
        capacity: 15, // maximum tokens in bucket 
      }), 
    ], 
  }); 
} catch (error) {
  console.error("Error initializing Arcjet:", error.message);
  // Optionally provide a fallback or exit
}

export { aj };