// components/UsersList.js
import { useEffect, useState } from "react";
import { getDatabase, ref, onValue } from "firebase/database";

function UsersList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const database = getDatabase();
    const usersRef = ref(database, "users");
    const statusRef = ref(database, "status");

    const commentsRef = ref(
      database,
      "status/" + "x2jlzqpLl4d1OLccG4yZiVezGjz2"
    );

    onValue(commentsRef, (snapshot) => {
      const usersData = snapshot.val();
      console.log(usersData);
    });

    // Fetch users
    onValue(usersRef, (snapshot) => {
      const usersData = snapshot.val();
      // console.log(snapshot);
      const usersList = [];

      for (let uid in usersData) {
        usersList.push({
          uid,
          ...usersData[uid],
        });
        // console.log(usersData);
      }

      // Fetch user statuses
      onValue(statusRef, (statusSnapshot) => {
        const statusData = statusSnapshot.val();

        // console.log(statusData);

        const updatedUsersList = usersList.map((user) => {
          const userStatus = statusData[user.uid] || {};
          return {
            ...user,
            status: userStatus.state || "offline",
            lastChanged: userStatus.lastChanged || "N/A",
          };
        });

        // console.log(updatedUsersList);
        setUsers(updatedUsersList);
      });
    });
  }, []);

  return (
    <div>
      <h3>All Users</h3>
      <ul>
        {users.map((user) => (
          <li key={user.uid}>
            {user.name} -{" "}
            {user.status === "online"
              ? "Online"
              : `Last active: ${user.lastChanged}`}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default UsersList;
