import { getDatabase, ref, onValue } from "firebase/database";

const getLastSeen = (uid) => {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    const statusRef = ref(database, "status/" + uid);

    onValue(
      statusRef,
      (snapshot) => {
        const usersData = snapshot.val();
        resolve(usersData);
      },
      (error) => {
        reject(error);
      }
    );
  });
};

export default getLastSeen;

export { getLastSeen };
