declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Firebase Configuration
      NEXT_PUBLIC_FIREBASE_API_KEY: string;
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: string;
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
      NEXT_PUBLIC_FIREBASE_APP_ID: string;

      // Application Configuration
      NEXT_PUBLIC_MAX_EVENTS_PER_DAY: string;
      NEXT_PUBLIC_RESTRICTED_TIME_START: string;
      NEXT_PUBLIC_RESTRICTED_TIME_END: string;
      NEXT_PUBLIC_MAX_EVENTS_DURING_RESTRICTION: string;
      NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN: string;
      NEXT_PUBLIC_APP_NAME: string;

      // JWT Secret
      JWT_SECRET: string;

      // Email Configuration
      EMAIL_HOST: string;
      EMAIL_PORT: string;
      EMAIL_USER: string;
      EMAIL_PASSWORD: string;

      // Admin Credentials
      ADMIN_EMAIL: string;
      ADMIN_PASSWORD: string;

      // Firebase Admin SDK Configuration
      GOOGLE_APPLICATION_CREDENTIALS: string;
      FIREBASE_SERVICE_ACCOUNT: string;
      FIREBASE_STORAGE_BUCKET: string;
    }
  }
}

export {};
