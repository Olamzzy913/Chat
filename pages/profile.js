import { useState, useEffect } from "react";
import { auth, db } from "@/utils/firebase";
import Reel from "@/components/reel/reel";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [reels, setReels] = useState([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      const userId = user.uid;
      db.collection("users")
        .doc(userId)
        .get()
        .then((doc) => {
          if (doc.exists) {
            setUser(doc.data());
          }
        });

      db.collection("reels")
        .where("userId", "==", userId)
        .onSnapshot((snapshot) => {
          const userReels = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setReels(userReels);
        });
    });
  }, []);

  const handleDelete = async (reelId) => {
    await db.collection("reels").doc(reelId).delete();
    setReels(reels.filter((reel) => reel.id !== reelId));
  };

  return (
    <div>
      {user && (
        <div>
          <h1>{user.username}</h1>
          <p>{user.followers.length} Followers</p>
          <p>{user.following.length} Following</p>
          <p>{reels.length} Posts</p>
        </div>
      )}
      <div className="reels">
        {reels.map((reel) => (
          <div key={reel.id}>
            <Reel reel={reel} />
            <button onClick={() => handleDelete(reel.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Profile;
