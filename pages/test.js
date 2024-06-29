import React, { useEffect, useRef, useState } from "react";
// import { firestore } from "../firebaseConfig";

const Call = () => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [pc, setPc] = useState(null);

  useEffect(() => {
    const setupWebRTC = async () => {
      const servers = {
        iceServers: [
          {
            urls: "stun:stun.l.google.com:19302",
          },
        ],
      };

      const pc = new RTCPeerConnection(servers);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          firestore
            .collection("calls")
            .doc("callID")
            .collection("iceCandidates")
            .add(event.candidate.toJSON());
        }
      };

      pc.ontrack = (event) => {
        remoteVideoRef.current.srcObject = event.streams[0];
      };

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localVideoRef.current.srcObject = stream;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      setPc(pc);
    };

    setupWebRTC();
  }, []);

  const createOffer = async () => {
    const callDoc = firestore.collection("calls").doc("callID");
    const offerCandidates = callDoc.collection("offerCandidates");
    const answerCandidates = callDoc.collection("answerCandidates");

    const offerDescription = await pc.createOffer();
    await pc.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };

    await callDoc.set({ offer });

    callDoc.onSnapshot((snapshot) => {
      const data = snapshot.data();
      if (data && data.answer && !pc.currentRemoteDescription) {
        const answerDescription = new RTCSessionDescription(data.answer);
        pc.setRemoteDescription(answerDescription);
      }
    });

    answerCandidates.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const candidate = new RTCIceCandidate(change.doc.data());
          pc.addIceCandidate(candidate);
        }
      });
    });
  };

  const createAnswer = async () => {
    const callDoc = firestore.collection("calls").doc("callID");
    const offerCandidates = callDoc.collection("offerCandidates");
    const answerCandidates = callDoc.collection("answerCandidates");

    const callData = (await callDoc.get()).data();

    const offerDescription = callData.offer;
    await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);

    const answer = {
      sdp: answerDescription.sdp,
      type: answerDescription.type,
    };

    await callDoc.update({ answer });

    offerCandidates.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const candidate = new RTCIceCandidate(change.doc.data());
          pc.addIceCandidate(candidate);
        }
      });
    });
  };

  return (
    <div>
      <video ref={localVideoRef} autoPlay playsInline />
      <video ref={remoteVideoRef} autoPlay playsInline />

      <button onClick={createOffer}>Call</button>
      <button onClick={createAnswer}>Answer</button>
    </div>
  );
};

export default Call;
