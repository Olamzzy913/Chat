// pages/_app.js
import "@/styles/globals.css";
import { useEffect } from "react";
import { trackUserStatus } from "@/utils/activeUser/updateLastSeen";
import { getAuth, onAuthStateChanged } from "firebase/auth";

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        trackUserStatus();
      }
    });
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
