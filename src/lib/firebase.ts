import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyARQGB5-GfHe0tBQeqQjj2jxuCVos3xd24",
  authDomain: "love-on-the-pixel.firebaseapp.com",
  projectId: "love-on-the-pixel",
  storageBucket: "love-on-the-pixel.firebasestorage.app",
  messagingSenderId: "804048668508",
  appId: "1:804048668508:web:fa1e691f822e33ac742399"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
let messaging: any = null;

// Only initialize messaging on client side and when service worker is available
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.warn('Firebase messaging not available:', error);
  }
}

export { messaging, getToken, onMessage };
export default app;
