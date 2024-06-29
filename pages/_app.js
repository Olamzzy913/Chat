// pages/_app.js
import "@/styles/globals.css";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { auth } from "@/utils/firebase";
import { trackUserStatus } from "@/utils/activeUser/updateLastSeen";
import { getAuth, onAuthStateChanged } from "firebase/auth";

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        trackUserStatus();
      } else {
      }
    });
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user && router.pathname !== "/") {
        router.push("/");
      }
    });
    return () => unsubscribe();
  }, [router]);

  return <Component {...pageProps} />;
}

export default MyApp;
