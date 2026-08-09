import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyAekw5iD-7t-BeRbrVBykXNWqtY0C7y7ug",
  authDomain: "tarazan-284f3.firebaseapp.com",
  projectId: "tarazan-284f3",
  storageBucket: "tarazan-284f3.firebasestorage.app",
  messagingSenderId: "382519802983",
  appId: "1:382519802983:web:c5826a8cdba73335a528c2",
  measurementId: "G-KCRSY63RTC"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
