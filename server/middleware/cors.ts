import cors from 'cors';

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Permetti richieste senza origin (es. mobile app), origin 'null' (iframe), 
    // o origini locali standard
    const allowedPatterns = [
      /^http:\/\/localhost(:\d+)?$/,
      /^http:\/\/127\.0\.0\.1(:\d+)?$/,
      /^chrome-error:\/\/chromewebdata$/
    ];

    if (!origin || origin === 'null' || allowedPatterns.some(pattern => pattern.test(origin))) {
      callback(null, true);
    } else {
      console.warn("[CORS] Origin non autorizzata, ma consentita in DEV:", origin);
      callback(null, true); 
    }
  },
  credentials: true
});
