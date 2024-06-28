// // agora.js
// import AgoraRTC from "agora-rtc-sdk-ng";

// const APP_ID = "9d93fec3a0a947dcb285db2d3278b749";
// let client = null;
// let localAudioTrack = null;

// export const initAgoraClient = async () => {
//   client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
//   await client.initialize(APP_ID);
// };

// export const joinChannel = async (channel, token, uid) => {
//   await client.join(APP_ID, channel, token, uid);
//   localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
//   await client.publish([localAudioTrack]);
// };

// export const leaveChannel = async () => {
//   localAudioTrack.close();
//   await client.leave();
// };

let AgoraRTC;
if (typeof window !== "undefined") {
  AgoraRTC = require("agora-rtc-sdk-ng");
}

const APP_ID = "19a795359350436da011ee80ddcad3d2";
let client = null;
let localAudioTrack = null;

export const initAgoraClient = async () => {
  if (!AgoraRTC) return;
  client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
  await client.initialize(APP_ID);
};

export const joinChannel = async (channel, token, uid) => {
  if (!client) await initAgoraClient(); // Ensure client is initialized
  await client.join(APP_ID, channel, token, uid);
  localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
  await client.publish([localAudioTrack]);
};

export const leaveChannel = async () => {
  if (localAudioTrack) {
    localAudioTrack.close();
  }
  if (client) {
    await client.leave();
  }
};
