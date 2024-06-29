import { useState, useEffect } from "react";
import { auth, db } from "@/utils/firebase";

const Reel = ({ reel }) => {
  const [user, setUser] = useState(null);
  const [likes, setLikes] = useState(reel.likes.length);
  const [comments, setComments] = useState(reel.comments);

  useEffect(() => {
    // Fetch user data based on userId
    db.collection("users")
      .doc(reel.userId)
      .get()
      .then((doc) => {
        if (doc.exists) {
          setUser(doc.data());
        }
      });
  }, [reel.userId]);

  const handleLike = async () => {
    const userId = auth.currentUser.uid;
    const updatedLikes = reel.likes.includes(userId)
      ? reel.likes.filter((id) => id !== userId)
      : [...reel.likes, userId];

    await db.collection("reels").doc(reel.id).update({ likes: updatedLikes });
    setLikes(updatedLikes.length);
  };

  return (
    <div className="reel">
      {user && <p>{user.email}</p>}
      <button onClick={handleLike}>{likes} Likes</button>
      {/* Add Comment and Share functionalities */}
    </div>
  );
};

export default Reel;
