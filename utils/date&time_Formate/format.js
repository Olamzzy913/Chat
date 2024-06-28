const firestoreTimestampToDate = (timestamp) => {
  return new Date(timestamp?.seconds * 1000 + timestamp?.nanoseconds / 1000000);
};

const formatDate = (firestoreTimestampToDate) => {
  const messageDate = new Date(firestoreTimestampToDate);
  const currentDate = new Date();

  // Time difference in milliseconds
  const timeDiff = currentDate.getTime() - messageDate.getTime();
  const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

  if (diffDays === 1) {
    return "Today";
  } else if (diffDays === 2) {
    return "Yesterday";
  } else if (diffDays <= 7) {
    // Message within last week
    const dayOfWeek = messageDate.toLocaleDateString("en-US", {
      weekday: "long",
    });
    return dayOfWeek;
  } else {
    // Older than a week
    const formattedDate = messageDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return formattedDate;
  }
};

const formatTime = (timestamp) => {
  const date = new Date(timestamp?.seconds * 1000);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);

  const options = {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
    day: "numeric",
    month: "long",
  };

  // Format the time separately
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });

  // Format the date part without the year
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "long" });

  return `${time}, ${month} ${day}`;
};

function displayUserTimeFormat(timestamp) {
  const date = new Date(timestamp);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(today.getDate() - 3);

  if (date >= today) {
    // Today: show time (e.g., 7:13 AM)
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12; // Convert 0 hours to 12 for AM/PM
    return `${displayHours}:${minutes} ${ampm}`;
  } else if (date >= yesterday) {
    // Yesterday
    return "Yesterday";
  } else if (date >= threeDaysAgo) {
    // Within the last 3 days, but not today or yesterday: show "3 days ago"
    const daysAgo = Math.floor((today - date) / (1000 * 60 * 60 * 24));
    return `${daysAgo} days ago`;
  } else {
    // More than 3 days ago: show date (e.g., 6/25/24)
    const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Months are 0-based
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear().toString().slice(-2); // Last two digits of the year
    return `${month}/${day}/${year}`;
  }
}

const recordFormatTime = (time) => {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};

export {
  recordFormatTime,
  displayUserTimeFormat,
  formatTimestamp,
  formatTime,
  formatDate,
  firestoreTimestampToDate,
};

// const combineObjects = (data) => {
//     const initialObjects = data.slice(0, 2);
//     const messageObjects = data.slice(2);

//     const combinedResults = initialObjects.map((obj) => {
//       const email = obj.email1;
//       const combinedMessages = messageObjects.filter(
//         (msgObj) => msgObj.from === email
//       );
//       return {
//         ...obj,
//         messages: combinedMessages,
//       };
//     });
//     log;
//     return combinedResults;
//   };
