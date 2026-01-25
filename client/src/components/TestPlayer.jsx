import React from "react";
import ReactPlayer from "react-player";

const TestPlayer = () => {
  return (
    <div style={{ padding: 40 }}>
      <h2>ReactPlayer Test</h2>

      {/* MP4 TEST (must work) */}
      <ReactPlayer
        url="https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4"
        controls
        width="640px"
        height="360px"
      />
      <ReactPlayer
        url="https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
        controls
        width="640px"
        height="360px"
      />
    </div>
  );
};

export default TestPlayer;
