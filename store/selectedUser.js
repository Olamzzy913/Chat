// import { createContext, useState } from "react";

// export const SelectedUserContext = createContext({
//   //   setCurrentUser: () => null,
//   selectedUserLastSeen: null,
// });

// export const UserProvider = ({ children }) => {
//   const [selectedUserLastSeen, setSelectedUserLastSeen] = useState(null);
//   const value = { selectedUserLastSeen, setSelectedUserLastSeen };

//   return (
//     <SelectedUserContext.Provider value={value}>
//       {children}
//     </SelectedUserContext.Provider>
//   );
// };

import React, { createContext, useState, useEffect } from "react";
import { getDatabase, ref, get } from "firebase/database";
import getLastSeen from "@/utils/getLastSeen";

const UserContext = createContext();

const UserProvider = ({ children }) => {
  useEffect(() => {
    getLastSeen();
  }, []);

  return (
    <UserContext.Provider value={{ userData, loading, error }}>
      {children}
    </UserContext.Provider>
  );
};

export { UserContext, UserProvider };
