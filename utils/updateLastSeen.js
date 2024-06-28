// userStatus.js
import {
  getDatabase,
  ref,
  onDisconnect,
  onValue,
  set,
} from "firebase/database";
import { auth } from "@/utils/firebase";
import { useState } from "react";

const database = getDatabase();

const useUserStatus = (userId) => {
  const [status, setStatus] = useState(null);

  const statusRef = ref(database, `users/${userId}/status`);

  const unsubscribe = onValue(statusRef, (snapshot) => {
    const data = snapshot.val();
    setStatus(data);
  });

  console.log(status);
};

export default useUserStatus;

function setUserStatus(uid, isOnline) {
  const userStatusDatabaseRef = ref(database, `/status/${uid}`);

  const status = {
    state: isOnline ? "online" : "offline",
    lastChanged: new Date().toISOString(),
  };

  set(userStatusDatabaseRef, status);
}

function trackUserStatus() {
  const uid = auth.currentUser.uid;

  // Listen for connection state
  const connectedRef = ref(database, ".info/connected");
  onValue(connectedRef, (snapshot) => {
    if (snapshot.val() === false) {
      return;
    }

    // User is online
    setUserStatus(uid, true);

    const userStatusDatabaseRef = ref(database, `/status/${uid}`);
    // Set user status to offline when they disconnect
    onDisconnect(userStatusDatabaseRef).set({
      state: "offline",
      lastChanged: new Date().toISOString(),
    });
  });
}

export { trackUserStatus, setUserStatus };
