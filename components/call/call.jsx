// pages/index.js
import { useEffect, useState } from "react";
import { auth } from "@/utils/firebase";
import {
  initAgoraClient,
  joinChannel,
  leaveChannel,
} from "@/utils/call.util/agora";

export default function Call() {
  const [user, setUser] = useState(null);
  const [channel, setChannel] = useState("");
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleJoin = async () => {
    await initAgoraClient();
    await joinChannel(channel, null, auth.currentUser.uid);
    setJoined(true);
  };

  const handleLeave = async () => {
    await leaveChannel();
    setJoined(false);
  };

  return (
    <div>
      <h1>Agora Voice Call</h1>
      {user ? (
        <>
          <p>Welcome, {user.displayName}</p>
          <div>
            <input
              type="text"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              placeholder="Channel Name"
            />
            {joined ? (
              <button onClick={handleLeave}>Leave Channel</button>
            ) : (
              <button onClick={handleJoin}>Join Channel</button>
            )}
          </div>
        </>
      ) : (
        <button>Sign In with Google</button>
      )}
    </div>
  );
}
