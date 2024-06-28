import { useState, useEffect } from "react";
import { RiChatNewFill, RiLogoutCircleRLine } from "react-icons/ri";
import { IoSearch, IoCameraOutline, IoAdd, IoMdSend } from "react-icons/io5";
import { MdAddCall, MdOutlineMic } from "react-icons/md";
import { BsThreeDotsVertical } from "react-icons/bs";

function ChatApp() {
  const [addNewChat, setAddNewChat] = useState(false);
  const [username, setUsername] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isMobile, setIsMobile] = useState(document.window.innerWidth <= 700);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 700);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <div className="flex h-screen antialiased text-gray-800">
        <div className="flex flex-row h-full w-full overflow-x-hidden relative">
          <div
            className={`flex flex-col py-1 px-2 ${
              isMobile && selectedUser ? "hidden" : "w-[30%]"
            } bg-white flex-shrink-0 relative`}
          >
            <RiChatNewFill
              onClick={() => setAddNewChat(!addNewChat)}
              className="absolute z-50 bottom-4 right-6 text-white bg-[#13C730] hover:drop-shadow text-[2rem] p-2 rounded-full cursor-pointer"
            />
            <div className="flex flex-col mt-8 relative">
              <div
                className={
                  addNewChat
                    ? "absolute top-0 left-0 w-[100%] bg-white text-black p-2 h-full transition-all duration-500"
                    : "absolute top-0 -left-[400px] w-[30%] transition-all duration-500"
                }
              >
                <h1 className="text-[1rem] font-bold mt-4">New Chat</h1>
                <div className="flex w-full justify-between items-center">
                  <div className="flex items-center bg-[#E8E7E7] p-2 rounded-xl mt-2">
                    <IoSearch className="text-[#B8B5B5]" />
                    <input
                      type="search"
                      placeholder="Chat new user"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="outline-none bg-[#E8E7E7] ml-2"
                    />
                  </div>
                  <RiChatNewFill
                    onClick={handleCreateChat}
                    className="text-white bg-[#13C730] hover:drop-shadow text-[2rem] p-2 rounded-full cursor-pointer"
                  />
                </div>
                <div>
                  <button
                    className="flex flex-row items-center hover:bg-gray-100 rounded-xl p-2"
                    onClick={() => setSelectedUser(userResult)}
                  >
                    <div className="flex items-center uppercase justify-center h-8 w-8 bg-indigo-200 rounded-full">
                      {userResult.trim()[0]}
                    </div>
                    <div className="flex ml-2 justify-between w-full text-sm font-semibold">
                      <h2 className="text-start capitalize">{userResult}</h2>
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex justify-between ">
                <h2>Users</h2>
                <RiLogoutCircleRLine onClick={signOutUser} />
              </div>
              <p>{currentUser}</p>
              <div className="flex items-center bg-[#E8E7E7] p-2 rounded-xl mt-2">
                <IoSearch className="text-[#B8B5B5]" />
                <input
                  type="input"
                  placeholder="search"
                  className="outline-none w-full bg-[#E8E7E7] ml-2"
                />
              </div>
              <div className="flex flex-col space-y-1 mt-4 -mx-2 h-full overflow-y-auto">
                {users.map((user) => (
                  <button
                    className="flex flex-row items-center hover:bg-gray-100 pt-2 px-2 mt-0"
                    key={user.email}
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="flex items-center uppercase justify-center h-8 w-8 bg-indigo-200 rounded-full">
                      {user.email.trim()[0]}
                    </div>
                    <div className="flex ml-2 justify-between w-full group text-sm font-semibold border-b-[.25px] pb-2">
                      <div className="flex flex-col justify-start">
                        <h2 className="text-start capitalize">{user.name}</h2>
                        <span className="text-[10px] text-start font-normal">
                          {/* last message logic */}
                        </span>
                      </div>
                      <div className="flex flex-col justify-end text-end">
                        <h2 className="text-[10px] font-medium">
                          {/* timestamp logic */}
                        </h2>
                        {/* new message indicator logic */}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div
            className={`flex flex-col flex-auto h-full p-6 ${
              isMobile && !selectedUser ? "hidden" : ""
            }`}
          >
            <div className="flex flex-col flex-auto flex-shrink-0 rounded-2xl bg-[#F2EDE7] h-full">
              <div className="bg-white p-4 flex items-center justify-between">
                <div className="flex ">
                  <div className="flex uppercase items-center justify-center h-10 w-10 rounded-full bg-indigo-500 flex-shrink-0">
                    A
                  </div>
                  <div className="ml-4">
                    <p className="capitalised font-bold">{selectedUser}</p>
                    <p className="">{/* user status logic */}</p>
                  </div>
                </div>
                <div className="flex ">
                  <MdAddCall className="text-[1.2rem] cursor-pointer" />
                  <BsThreeDotsVertical className="text-[1.2rem] ml-3 cursor-pointer" />
                </div>
              </div>
              <div className="flex flex-col h-full overflow-x-auto px-3">
                <div className="flex flex-col h-full">
                  <div className="flex flex-col h-full">
                    {messages.map((group) => (
                      <div key={group.date}>
                        <h2 className="mx-auto rounded-xl my-2 w-[60px] text-[6.5px] text-center bg-white text-black p-1">
                          {formatDate(group.date)}
                        </h2>
                        <div className="grid grid-cols-12">
                          {group.messages.map((msg) =>
                            msg.from !== currentUser ? (
                              <div
                                key={msg.id}
                                className="col-start-1 col-end-8 p-[1px] rounded-lg"
                              >
                                <div className="flex flex-row items-center">
                                  <div className="relative text-sm bg-white text-black py-1 px-1 rounded-xl">
                                    {/* message content logic */}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div
                                key={msg.id}
                                className="col-start-6 col-end-13 p-[1px] rounded-lg"
                              >
                                <div className="flex items-center justify-start flex-row-reverse">
                                  <div className="relative text-sm bg-[#D9FDD3] text-black py-1 px-1 rounded-xl">
                                    {/* message content logic */}
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
                <div className="flex flex-row items-center h-16 px-2 gap-1 bg-white w-full">
                  {isRecording ? (
                    <div className="flex justify-end items-center gap-2 w-full">
                      <MdDelete onClick={deleteRecording} />
                      <span className="text-red-600 font-bold">
                        {recordFormatTime(elapsedTime)}
                      </span>
                      {isPaused ? (
                        <div className="bg-black h-[4px] rounded-xl w-[150px]"></div>
                      ) : (
                        <div className="flex gap-1 mx-1 h-[15px] ">
                          <div className="loader bg-black"></div>
                          <div className="loader bg-black"></div>
                          <div className="loader bg-black"></div>
                          <div className="loader bg-black"></div>
                        </div>
                      )}
                      {isPaused ? (
                        <MdOutlineMic
                          onClick={pauseRecording}
                          className="text-red-600 text-[1.2rem] cursor-pointer"
                        />
                      ) : (
                        <FaRegCirclePause
                          onClick={pauseRecording}
                          className="text-red-600 text-[1.2rem] cursor-pointer"
                        />
                      )}
                      <RiSendPlaneFill
                        onClick={sendRecording}
                        className="text-[#13C730] text-[1.2rem] cursor-pointer"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-1">
                        <label htmlFor="inputTag">
                          <IoCameraOutline className="text-[1.2rem] cursor-pointer" />
                          <input
                            id="inputTag"
                            type="file"
                            className="hidden"
                            onChange={handleImageChange}
                          />
                        </label>
                        <IoAdd className="text-[1.2rem] cursor-pointer" />
                      </div>
                      <div className="flex items-center bg-[#E8E7E7] rounded-xl w-full h-10 px-2">
                        <input
                          className="flex w-full border rounded-xl focus:outline-none focus:border-indigo-300 bg-[#E8E7E7] h-full px-2"
                          type="text"
                          placeholder="Message"
                          onChange={(e) => setInputMessage(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center justify-center h-10 w-10 rounded-full">
                        {inputMessage.length < 1 ? (
                          <MdOutlineMic
                            onClick={startRecording}
                            className="text-[1.3rem] cursor-pointer"
                          />
                        ) : (
                          <IoMdSend
                            onClick={sendMessage}
                            className="text-[#13C730] text-[1.3rem] cursor-pointer"
                          />
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <style>
        {`
          @media (max-width: 700px) {
            .hidden { display: none; }
            .w-[30%] { width: 100% !important; }
          }
        `}
      </style>
    </>
  );
}

export default ChatApp;
