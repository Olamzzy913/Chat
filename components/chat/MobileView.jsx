// pages/messages.js
import { useEffect, useState, useRef } from "react";
import { auth, db, signOutUser } from "@/utils/firebase";
import { IoMdSend } from "react-icons/io";
import { RiLogoutCircleRLine, RiChatNewFill } from "react-icons/ri";
import { FaRegCirclePause } from "react-icons/fa6";
import { BsThreeDotsVertical } from "react-icons/bs";
import { MdAddCall, MdOutlineMic, MdDelete } from "react-icons/md";
import { MdInsertPhoto, MdOutlineCancel } from "react-icons/md";
import { FaArrowLeft } from "react-icons/fa";
import { BiCheckDouble } from "react-icons/bi";
import { IoAdd, IoCameraOutline, IoSearch } from "react-icons/io5";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/router";
import {
  addDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDocs,
  where,
} from "firebase/firestore";
import { getLastSeen } from "@/utils/activeUser/getLastSeen";
import ChatAudio from "@/components/audio/chatAudio";
import {
  recordFormatTime,
  displayUserTimeFormat,
  formatTimestamp,
  formatTime,
  formatDate,
  firestoreTimestampToDate,
} from "@/utils/date&time_Formate/format";

export default function Messages() {
  const [currentUser, setCurrentUser] = useState("");
  const [username, setUsername] = useState("");
  const [userResult, setUserResult] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [readMsg, setReadMsg] = useState(false);
  const [addNewChat, setAddNewChat] = useState(false);
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [file, setFile] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioURL, setAudioURL] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const router = useRouter();
  const storage = getStorage();
  const [isSelectedUserActive, setIsSelectedUserActive] = useState([]);
  const [isMobile, setIsMobile] = useState(true);

  const sendMessage = async () => {
    const user = auth.currentUser;

    if (user && selectedUser) {
      if (!message && !file && !audioBlob) {
        return;
      }
      console.log("message sending....");
      let imageUrl = null;
      if (file) {
        // Upload the image to Firebase Storage
        const storageRef = ref(
          storage,
          `images/${new Date().getTime()}_${file.name}`
        );
        const snapshot = await uploadBytes(storageRef, file);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      let audioUrl = null;
      if (audioBlob) {
        console.log(audioBlob);
        // Upload the audio to Firebase Storage
        const audioRef = ref(storage, `audio/${new Date().getTime()}.wav`);
        const audioSnapshot = await uploadBytes(audioRef, audioBlob);
        audioUrl = await getDownloadURL(audioSnapshot.ref);
      }
      deleteRecording();

      const conversationId = getConversationId(user.email, selectedUser);
      await addDoc(
        collection(db, "conversations", conversationId, "messages"),
        {
          img: imageUrl,
          audio: audioUrl,
          text: message,
          from: user.email,
          to: selectedUser,
          timestamp: serverTimestamp(),
          unread: true,
        }
      );

      setMessage("");
      cancelSelectedFile();
      // deleteRecording();
      fetchUsers();
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      // console.log(user.uid);
      setCurrentUser(user.email);
      if (!user) {
        router.push("/");
      } else {
        fetchUsers();
        () => clearInterval(intervalRef.current);
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (selectedUser) {
      const conversationId = getConversationId(
        auth.currentUser.email,
        selectedUser
      );
      const q = query(
        collection(db, "conversations", conversationId, "messages"),
        orderBy("timestamp", "asc")
      );
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const msgs = [];
        querySnapshot.forEach((doc) => {
          msgs.push({ ...doc.data(), id: doc.id });
        });

        const groupedMessages = msgs.reduce((acc, message) => {
          const date = message.timestamp?.toDate().toDateString();
          const existingGroup = acc.find((group) => group.date === date);
          if (existingGroup) {
            existingGroup.messages.push(message);
          } else {
            acc.push({ date, messages: [message] });
          }
          return acc;
        }, []);

        setMessages(groupedMessages);
        fetchUsers();
        console.log(groupedMessages);
      });
      return () => unsubscribe();
    }
  }, [selectedUser]);

  const fetchUserData = async (uid) => {
    try {
      const userData = await getLastSeen(uid);
      setIsSelectedUserActive(userData);
      // Do something with the user data
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      // Step 1: Fetch all users except the current user
      const userQuery = query(collection(db, "users"));
      const userQuerySnapshot = await getDocs(userQuery);
      const userList = [];
      const chatHistoryPromises = [];

      userQuerySnapshot.forEach((doc) => {
        if (doc.data().email !== auth.currentUser.email) {
          const user = { id: doc.id, ...doc.data() };
          userList.push(user);
        }
      });

      // Step 2: Check chat history for each user
      userList.forEach((user) => {
        const conversationId = getConversationId(
          auth.currentUser.email,
          user.email
        );
        const q = query(
          collection(db, "conversations", conversationId, "messages"),
          orderBy("timestamp", "asc")
        );

        const chatHistoryPromise = new Promise((resolve) => {
          const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const messages = [];
            querySnapshot.forEach((doc) => {
              messages.push({ ...doc.data(), id: doc.id });
            });
            if (messages.length > 0) {
              user.lastMessage = messages[messages.length - 1];
              resolve(user);
            } else {
              resolve(null);
            }
            unsubscribe();
          });
        });

        chatHistoryPromises.push(chatHistoryPromise);
      });

      const chatHistories = await Promise.all(chatHistoryPromises);
      const filteredUsers = chatHistories.filter((user) => user !== null);

      // Adding unread messages count
      const usersWithUnreadCounts = await Promise.all(
        filteredUsers.map(async (user) => {
          const unreadCount = await countUnreadMessages(user.email);
          return { ...user, newMsg: unreadCount };
        })
      );

      // Sort users by last message timestamp (descending)
      usersWithUnreadCounts.sort((a, b) => {
        if (a.lastMessage && b.lastMessage) {
          return b.lastMessage.timestamp - a.lastMessage.timestamp;
        } else if (a.lastMessage) {
          return -1; // a has a message, should come before b
        } else if (b.lastMessage) {
          return 1; // b has a message, should come before a
        } else {
          return 0; // both don't have messages, maintain order
        }
      });

      setUsers(usersWithUnreadCounts);
      console.log(usersWithUnreadCounts);
    } catch (error) {
      console.error("Error fetching users or conversations:", error);
    }
  };

  const markAsRead = async (selectedUser) => {
    const conversationId = getConversationId(
      auth.currentUser.email,
      selectedUser
    );
    const q = query(
      collection(db, "conversations", conversationId, "messages").where(
        "read",
        "==",
        false
      ),
      orderBy("timestamp", "asc")
    );
    console.log(q);
    // const messagesSnapshot = await db .collection("conversations")
    //   .doc(conversationId)
    //   .collection("messages")
    //   .where("read", "==", false)
    //   .get();
    // messagesSnapshot.forEach((doc) => {
    //   doc.ref.update({ read: true });
    // });
  };

  const openChat = (user) => {
    console.log(user);
    // setSelectedUser(user);
    // markAsRead();
    // setReadMsg(true);
  };

  const countUnreadMessages = async (userEmail) => {
    const conversationId = getConversationId(auth.currentUser.email, userEmail);
    const q = query(
      collection(db, "conversations", conversationId, "messages"),
      where("unread", "==", true),
      where("to", "==", auth.currentUser.email)
    );

    try {
      const querySnapshot = await getDocs(q);
      const unreadMessageCount = querySnapshot.size;
      // console.log(unreadMessageCount); // Logging the count of unread messages

      return unreadMessageCount;
    } catch (error) {
      console.error("Error fetching unread messages:", error);
      return 0; // or handle the error as per your application's logic
    }
  };

  const handleCreateChat = async () => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("name", "==", username));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => {
      setUserResult(doc.data().email);
    });

    if (querySnapshot.empty) {
      alert("User not found");
      return;
    }
  };

  const getConversationId = (user1, user2) => {
    return [user1, user2].sort().join("_");
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
    console.log(selectedImage);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFile(file);
      console.log(file);
      const reader = new FileReader();

      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    setIsRecording(true);
    setElapsedTime(0);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);

    mediaRecorderRef.current.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
      const audioURL = URL.createObjectURL(audioBlob);
      setAudioBlob(audioBlob);
      setAudioURL(audioURL);
      audioChunksRef.current = [];
    };

    mediaRecorderRef.current.start();
    startTimer();
    setIsTyping(true);
  };

  const stopRecording = () => {
    setIsRecording(false);
    mediaRecorderRef.current.stop();
    stopTimer();
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (!isPaused) {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        stopTimer();
      } else {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        startTimer();
      }
    }
  };

  const deleteRecording = async () => {
    if (isRecording) {
      stopRecording();
    }
    if (isPaused) {
      setIsPaused(false);
    }
    setAudioURL("");
    setIsTyping(false);
    setElapsedTime(0);
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setElapsedTime((prevTime) => prevTime + 1);
    }, 1000);
  };

  const stopTimer = () => {
    clearInterval(timerRef.current);
  };

  useEffect(() => {
    return () => {
      stopTimer();
    };
  }, []);

  return (
    <>
      <div class="flex h-svh antialiased text-gray-800 md:hidden ">
        {/* <div class="flex flex-row h-full w-full overflow-x-hidden relative"> */}
        {isMobile && (
          <div class="flex w-full flex-col py-1 px-2 w-[30%] bg-white flex-shrink-0 relative px-[1rem]">
            <RiChatNewFill
              onClick={() => {
                setAddNewChat(!addNewChat);
              }}
              className="absolute z-50 bottom-4 right-6 text-white bg-[#13C730] hover:dropShadow text-[4rem] p-[.8rem] rounded-full cursor-pointer"
            />
            <div class="flex flex-col mt-8 relative">
              <div
                className={
                  addNewChat
                    ? "absolute top-0 left-0 w-[100%] bg-white text-black p-2 h-full transition-all duration-500"
                    : "absolute top-0 -left-[400px] w-[30%] transition-all duration-500"
                }
              >
                <h1 className="text-[1rem] font-bold text-center mt-4">
                  New Chat
                </h1>
                <div className="flex w-full justify-between  items-center bg-[#E8E7E7] p-[1rem] rounded-[4rem] mt-2">
                  <input
                    type="search"
                    placeholder="Chat new user"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="outline-none w-full text-[1.2rem] bg-[#E8E7E7] ml-2"
                  />
                  <IoSearch
                    onClick={handleCreateChat}
                    className="text-white bg-[#13C730]  hover:dropShadow text-[3rem] p-[.8rem] rounded-full cursor-pointer"
                  />
                </div>
                <div>
                  <button
                    className="flex flex-row items-center hover:bg-gray-100 rounded-xl p-[1rem] mt-4 w-full"
                    onClick={() => setSelectedUser(userResult)}
                  >
                    <div className="flex items-center text-[1rem] uppercase justify-center h-[4.2rem] w-[5rem] bg-indigo-200 rounded-full">
                      {userResult.trim()[0]}
                    </div>

                    <div className=" flex ml-2 justify-between w-full text-sm font-semibold">
                      <h2 className="text-start text-[1.2rem] capitalize">
                        {userResult}
                      </h2>
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex justify-between ">
                <h2 className="text-[1.15rem]">Users</h2>
                <RiLogoutCircleRLine
                  className=" text-[1.5rem] cursor-pointer"
                  onClick={signOutUser}
                />
              </div>
              <p className="text-[1.15rem]">{currentUser}</p>
              <div className="flex items-center bg-[#E8E7E7] p-[1rem] rounded-xl mt-2">
                <IoSearch className="text-[#B8B5B5] text-[2rem]" />
                <input
                  type="input"
                  placeholder="search"
                  className="outline-none w-full bg-[#E8E7E7] ml-2 text-[1.15rem]"
                />
              </div>
              <div class="flex flex-col  mt-4 -mx-2 h-full overflow-y-auto">
                {users.map((user) => (
                  <button
                    className="flex flex-row items-center hover:bg-gray-100 px-2"
                    key={user.email}
                    onClick={() =>
                      setSelectedUser(user.email) ||
                      setIsMobile(!isMobile) ||
                      fetchUserData(user.id) ||
                      cancelSelectedFile() ||
                      setMessage("") ||
                      setIsTyping(false) ||
                      setIsPaused(false)
                    }
                  >
                    <div className="flex items-center text-[1.25rem] uppercase justify-center mr-2 h-[4rem] w-[4.6rem] bg-indigo-200 rounded-full">
                      {user.email.trim()[0]}
                    </div>

                    <div className=" flex ml-2 justify-between w-full group text-sm font-semibold border-b-[.25px] py-[1.2rem]">
                      <div className="flex flex-col justify-start">
                        <h2 className="text-start text-[1.3rem] mb-[.6rem] capitalize">
                          {user.name}
                        </h2>
                        <span className="text-[10px] text-start font-normal">
                          {!user.lastMessage.img &&
                            user.lastMessage.audio &&
                            !user.lastMessage.text && (
                              <div className="flex items-center">
                                <MdOutlineMic className="text-[#181C1B] text-[1.2rem]" />
                                <h1 className="text-md font-normal text-[1rem] ml-1">
                                  audio
                                </h1>
                              </div>
                            )}
                          {user.lastMessage.img &&
                            !user.lastMessage.audio &&
                            !user.lastMessage.text && (
                              <div className="flex items-center">
                                <MdInsertPhoto className="text-[#181C1B] text-[1.2rem]" />
                                <h1 className="text-md font-normal text-[1rem] ml-1">
                                  Photo
                                </h1>
                              </div>
                            )}
                          {user.lastMessage.img &&
                            !user.lastMessage.audio &&
                            user.lastMessage.text && (
                              <div className="flex items-center">
                                <MdInsertPhoto className="text-[#181C1B] text-[1.2rem]" />
                                <h1 className="text-md font-normal text-[1rem] ml-1">
                                  {user.lastMessage.text ? (
                                    user.lastMessage.text.length > 25 ? (
                                      <h1 className="text-md text-[1rem] font-normal ml-1">
                                        {user.lastMessage.text.substring(
                                          0,
                                          25
                                        ) + "..."}
                                      </h1>
                                    ) : (
                                      <h1 className="text-md text-[1rem] font-normal ml-1">
                                        {user.lastMessage.text}
                                      </h1>
                                    )
                                  ) : (
                                    "Photo"
                                  )}
                                </h1>
                              </div>
                            )}
                          {!user.lastMessage.img &&
                            !user.lastMessage.audio &&
                            user.lastMessage.text &&
                            (user.lastMessage.text.length > 25 ? (
                              <h1 className="text-md text-[1rem] font-normal ml-1">
                                {user.lastMessage.text.substring(0, 25) + "..."}
                              </h1>
                            ) : (
                              <h1 className="text-md text-[1rem] font-normal ml-1">
                                {user.lastMessage.text}
                              </h1>
                            ))}
                        </span>
                      </div>
                      <div className="flex flex-col justify-end text-end gap-3">
                        <h2 className="text-[10px] font-medium">
                          {displayUserTimeFormat(
                            firestoreTimestampToDate(user.lastMessage.timestamp)
                          )}
                        </h2>
                        {user.lastMessage.from !== auth.currentUser.email ? (
                          readMsg ? (
                            <p className="text-transparent w-[2rem] rounded-full">
                              {user.newMsg}
                            </p>
                          ) : (
                            <p className="text-white w-[2rem] ml-[2rem] py-[.35rem] text-center text-[.8rem] bg-[#13C730] rounded-full">
                              {user.newMsg}
                            </p>
                          )
                        ) : (
                          <p className="text-transparent w-[2rem] rounded-full">
                            {user.newMsg}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {!isMobile && (
          <div class="flex flex-col flex-auto h-full p-6">
            {file && (
              <>
                <div className="flex flex-col gap-4 mb-16 justify-center items-center">
                  <div className="flex justify-between w-full mb-12">
                    <p className="text-[1.2rem]">Selected Image</p>
                    <MdOutlineCancel
                      className="text-[2rem]"
                      onClick={() => {
                        setSelectedImage(null) || setFile(null);
                      }}
                    />
                  </div>
                  <img
                    src={selectedImage}
                    className="w-[60%] mx-auto h-[20rem] object-cover"
                  />
                </div>

                <div class="flex flex-row items-center h-16 px-2 gap-2 bg-white w-full">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                    }}
                    placeholder="Type your message"
                    className="flex w-full border rounded-xl focus:outline-none focus:border-indigo-300 pl-4 h-[4rem]"
                  />

                  <IoMdSend
                    onClick={sendMessage}
                    className="text-white bg-[#13C730]  text-[2.8rem] w-[3.2rem] py-[.9rem] rounded-full cursor-pointer"
                  />
                </div>
              </>
            )}

            {selectedUser && !file && (
              <div class="flex flex-col flex-auto flex-shrink-0 rounded-2xl bg-[#F2EDE7] h-full ">
                <div className="bg-white p-4 flex items-center justify-between">
                  <div className="flex items-center  ">
                    <FaArrowLeft
                      className="text-[1.2rem] mr-3"
                      onClick={() => {
                        setIsMobile(!isMobile);
                      }}
                    />
                    <div class="flex uppercase items-center justify-center h-10 w-10 rounded-full bg-indigo-500 flex-shrink-0">
                      A
                    </div>
                    <div className="ml-4">
                      <p className="capitalised font-bold text-[1.25rem]">
                        {selectedUser}
                      </p>
                      <p className="text-[1.1rem]">
                        {isSelectedUserActive.state === "online"
                          ? isSelectedUserActive.state
                          : "last seen " +
                            formatTimestamp(isSelectedUserActive.lastChanged)}
                      </p>
                    </div>
                  </div>
                  <div className="flex ">
                    <MdAddCall className="text-[1.5rem] cursor-pointer" />
                    <BsThreeDotsVertical className="text-[1.5rem] ml-3 cursor-pointer" />
                  </div>
                </div>
                <div class="flex flex-col h-full overflow-x-auto px-3">
                  <div class="flex flex-col h-full">
                    <div class="flex flex-col h-full">
                      {messages.map((group) => (
                        <div key={group.date}>
                          <h2 className="mx-auto rounded-xl my-2 w-[6rem] text-[.65rem] text-center bg-white text-black p-1">
                            {formatDate(group.date)}
                          </h2>
                          <div className="grid grid-cols-20">
                            {group.messages.map((msg) =>
                              msg.from !== currentUser ? (
                                <div
                                  key={msg.id}
                                  className="col-start-1 col-end-8 p-[1px] rounded-lg"
                                >
                                  <div className="flex flex-row items-center">
                                    <div className="relative text-sm bg-white text-black py-[.8rem] px-[.8rem] rounded-xl">
                                      {msg.audio && !msg.img && !msg.text && (
                                        <div className="relative">
                                          <ChatAudio url={msg.audio} />
                                          <span className="absolute bottom-0 right-4 text-[.7rem] flex items-center float-end">
                                            {formatTime(msg.timestamp)}
                                            <BiCheckDouble className="text-[.9rem] font-light ml-[2px]" />
                                          </span>
                                        </div>
                                      )}
                                      {!msg.audio && msg.img && !msg.text && (
                                        <>
                                          <img
                                            className=" w-[24rem] h-[20rem] rounded-md object-cover"
                                            src={msg.img}
                                          />
                                          <div
                                            className={
                                              msg.img || !msg.text
                                                ? "text-[1rem] pr-[5.8rem] w-[24rem]"
                                                : "text-[1rem] py-[.8rem]  pr-[5.8rem] w-[24rem]"
                                            }
                                          >
                                            {msg.text}
                                            <span className="text-white absolute bottom-[.6rem] right-4 text-[.8rem] flex items-center float-end">
                                              {formatTime(msg.timestamp)}
                                              <BiCheckDouble className="text-[1.5rem] font-light ml-[2px]" />
                                            </span>
                                          </div>
                                        </>
                                      )}
                                      {!msg.audio && msg.img && msg.text && (
                                        <>
                                          <img
                                            className=" w-[24rem] h-[20rem] rounded-md object-cover"
                                            src={msg.img}
                                          />
                                          <div
                                            className={
                                              msg.img || !msg.text
                                                ? "text-[1rem] pr-[5.8rem] w-[24rem]"
                                                : "text-[1rem] py-[.8rem]  pr-[5.8rem] w-[24rem]"
                                            }
                                          >
                                            {msg.text}
                                            <span className="text-black absolute bottom-[.6rem] right-4 text-[.8rem] flex items-center float-end">
                                              {formatTime(msg.timestamp)}
                                              <BiCheckDouble className="text-[1.5rem] font-light ml-[2px]" />
                                            </span>
                                          </div>
                                        </>
                                      )}
                                      {!msg.audio && !msg.img && msg.text && (
                                        <div className="text-[10px] pl-2 pr-[5.8rem]">
                                          {msg.text}
                                          <span className="absolute bottom-[.4rem] right-4 text-[.8rem] flex items-center float-end">
                                            {formatTime(msg.timestamp)}
                                            <BiCheckDouble className="text-[1.5rem] font-light ml-[2px]" />
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  key={msg.id}
                                  className="col-start-6 col-end-13 p-[1px] rounded-lg"
                                >
                                  <div className="flex items-center justify-start flex-row-reverse">
                                    <div className="relative text-sm bg-[#D9FDD3] text-black py-[.8rem] px-[.8rem] rounded-xl">
                                      {msg.audio && !msg.img && !msg.text && (
                                        <div className="relative">
                                          <ChatAudio url={msg.audio} />
                                          <span className="absolute bottom-0 right-4 text-[1rem] flex items-center float-end">
                                            {formatTime(msg.timestamp)}
                                            <BiCheckDouble className="text-[1.5rem] font-light ml-[2px]" />
                                          </span>
                                        </div>
                                      )}
                                      {!msg.audio && msg.img && !msg.text && (
                                        <>
                                          <img
                                            className=" w-[24rem] h-[20rem] rounded-md object-cover"
                                            src={msg.img}
                                          />
                                          <div
                                            className={
                                              msg.img || !msg.text
                                                ? "text-[1rem] pr-[5.8rem] w-[24rem]"
                                                : "text-[1rem] py-[.8rem]  pr-[5.8rem] w-[24rem]"
                                            }
                                          >
                                            {msg.text}
                                            <span className="text-white absolute bottom-[.6rem] right-4 text-[.8rem] flex items-center float-end">
                                              {formatTime(msg.timestamp)}
                                              <BiCheckDouble className="text-[1.5rem] font-light ml-[2px]" />
                                            </span>
                                          </div>
                                        </>
                                      )}
                                      {!msg.audio && msg.img && msg.text && (
                                        <>
                                          <img
                                            className=" w-[24rem] h-[20rem] rounded-md object-cover"
                                            src={msg.img}
                                          />
                                          <div
                                            className={
                                              msg.img || !msg.text
                                                ? "text-[1rem] pr-[5.8rem] w-[24rem]"
                                                : "text-[1rem] py-[.8rem]  pr-[5.8rem] w-[24rem]"
                                            }
                                          >
                                            {msg.text}
                                            <span className="text-black absolute bottom-[.6rem] right-4 text-[.8rem] flex items-center float-end">
                                              {formatTime(msg.timestamp)}
                                              <BiCheckDouble className="text-[1.5rem] font-light ml-[2px]" />
                                            </span>
                                          </div>
                                        </>
                                      )}
                                      {!msg.audio && !msg.img && msg.text && (
                                        <div className="text-[1rem] pl-2 pr-[5.8rem]">
                                          {msg.text}
                                          <span className="absolute bottom-[.4rem] right-4 text-[.8rem] flex items-center float-end">
                                            {formatTime(msg.timestamp)}
                                            <BiCheckDouble className="text-[1.5rem] font-light ml-[2px]" />
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {selectedUser && (
                  <div class="flex flex-row items-center h-[9rem] mt-2 px-2 gap-1 bg-white w-full">
                    {isRecording ? (
                      <div className="flex justify-end items-center gap-2 w-full">
                        <MdDelete
                          className="text-[1.6rem]"
                          onClick={deleteRecording}
                        />
                        <span className="text-red-600 font-bold">
                          {recordFormatTime(elapsedTime)}
                        </span>
                        {isPaused ? (
                          <div className="bg-black  h-[4px] rounded-xl w-[150px]"></div>
                        ) : (
                          <div className="flex gap-1 mx-1 h-[15px] ">
                            <div class="loader bg-black"></div>
                            <div class="loader bg-black"></div>
                            <div class="loader bg-black"></div>
                            <div class="loader bg-black"></div>
                          </div>
                        )}

                        {isPaused ? (
                          <MdOutlineMic
                            onClick={pauseRecording}
                            className="text-red-600 text-[1.6rem]  cursor-pointer"
                          />
                        ) : (
                          <FaRegCirclePause
                            onClick={pauseRecording}
                            className="text-red-600 text-[1.6rem]  cursor-pointer"
                          />
                        )}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => {
                          setMessage(e.target.value) ||
                          setIsTyping(true) ||
                          message.value === ""
                            ? setIsTyping(false)
                            : setIsTyping(true);
                        }}
                        placeholder="Type your message"
                        className="flex w-full border rounded-xl text-[1.15rem] focus:outline-none focus:border-indigo-300 pl-4 h-[4rem]"
                      />
                    )}

                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                    />
                    <IoCameraOutline className="text-[3rem] hover:bg-gray-100 cursor-pointer p-1 rounded-xl" />
                    <IoAdd
                      onClick={handleButtonClick}
                      className="text-[3rem] hover:bg-gray-100 cursor-pointer p-1 rounded-xl"
                    />
                    {isTyping ? (
                      <IoMdSend
                        onClick={sendMessage}
                        className="text-white bg-[#13C730]  text-[3.6rem] w-[4.8rem] py-[1rem] rounded-full cursor-pointer"
                      />
                    ) : (
                      <MdOutlineMic
                        onClick={startRecording}
                        className="text-white bg-[#13C730] text-[3.6rem] w-[4.8rem] py-[1rem] rounded-full cursor-pointer"
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
