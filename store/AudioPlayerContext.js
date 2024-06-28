// contexts/AudioPlayerContext.js
import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
} from "react";
import { Howl } from "howler";

const AudioPlayerContext = createContext();

export const useAudioPlayer = () => {
  return useContext(AudioPlayerContext);
};

export const AudioPlayerProvider = ({ children }) => {
  const soundRef = useRef(null);
  const [currentSong, setCurrentSong] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [seek, setSeek] = useState("00:00");
  const [duration, setDuration] = useState("00:00");
  const [playerProgress, setPlayerProgress] = useState("0%");

  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.on("play", () => {
        requestAnimationFrame(updateProgress);
      });

      soundRef.current.on("load", () => {
        setDuration(formatTime(soundRef.current.duration()));
      });

      soundRef.current.on("end", () => {
        setPlaying(false);
        setSeek(helper.formatTime(0));
        setPlayerProgress("0%");
      });
    }

    return () => {
      if (soundRef.current) {
        soundRef.current.unload();
      }
    };
  }, [currentSong]);

  const updateProgress = () => {
    if (soundRef.current && soundRef.current.playing()) {
      const currentSeek = soundRef.current.seek();
      setSeek(helper.formatTime(currentSeek));
      setPlayerProgress(
        `${(currentSeek / soundRef.current.duration()) * 100}%`
      );
      requestAnimationFrame(updateProgress);
    }
  };

  const loadNewSong = (song) => {
    if (soundRef.current) {
      soundRef.current.unload();
    }

    setCurrentSong(song);

    soundRef.current = new Howl({
      src: [song.url],
      html5: true,
    });

    soundRef.current.play();
    setPlaying(true);
  };

  const toggleAudio = () => {
    if (soundRef.current) {
      if (playing) {
        soundRef.current.pause();
      } else {
        soundRef.current.play();
      }
      setPlaying(!playing);
    }
  };

  const seekAudio = (event) => {
    if (!soundRef.current) return;

    const { x, width } = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - x;
    const percentage = clickX / width;
    const newSeek = soundRef.current.duration() * percentage;

    soundRef.current.seek(newSeek);
    setSeek(helper.formatTime(newSeek));
    setPlayerProgress(`${(newSeek / soundRef.current.duration()) * 100}%`);
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        currentSong,
        playing,
        seek,
        duration,
        playerProgress,
        loadNewSong,
        toggleAudio,
        seekAudio,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
};
