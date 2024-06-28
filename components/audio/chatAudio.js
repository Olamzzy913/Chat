import React, { useState, useRef, useEffect } from "react";
import { FaPlay } from "react-icons/fa6";
import { MdOutlinePause } from "react-icons/md";
import { IoMdHeadset } from "react-icons/io";

const ChatAudio = ({ url }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    if (audio) {
      audio.addEventListener("loadedmetadata", handleLoadedMetadata);
      audio.addEventListener("ended", handleEnded);

      return () => {
        audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
        audio.removeEventListener("ended", handleEnded);
      };
    }
  }, []);

  const togglePlayPause = () => {
    const prevValue = isPlaying;
    setIsPlaying(!prevValue);

    if (!prevValue) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <div className="flex  items-center rounded-[20px] p-[10px] bg-[inherit] max-w-[400px]">
      {isPlaying ? (
        <MdOutlinePause
          onClick={togglePlayPause}
          className="mr-[10px] cursor-pointer text-[1.2rem] text-[#6F8171]"
        />
      ) : (
        <FaPlay
          onClick={togglePlayPause}
          className="mr-[10px] cursor-pointer text-[#6F8171]"
        />
      )}
      {isPlaying ? (
        <div className="flex gap-1 mx-1 h-[15px]">
          <div class="loader"></div>
          <div class="loader"></div>
          <div class="loader"></div>
          <div class="loader"></div>
          <div class="loader"></div>
        </div>
      ) : (
        <div className="bg-[#6F8171]  h-[4px] rounded-xl w-[150px]"></div>
      )}

      <div className="text-[#6F8171] text-[.7rem] ml-3">
        {formatTime(currentTime)}
      </div>
      <audio ref={audioRef} src={url} className="hidden"></audio>
    </div>
  );
};

export default ChatAudio;
