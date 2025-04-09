"use client";

import { getSrc } from "@livepeer/react/external";
import * as Player from "@livepeer/react/player";

import { vodSource } from "./source";

export default () => {
  return (
    <Player.Root src={getSrc(vodSource)} autoPlay volume={0}>
      <Player.Container>
        <Player.Video
          title="Agent 327"
          style={{ height: "100%", width: "100%" }}
        />
        <Player.LiveIndicator
          matcher={false}
          style={{
            position: "absolute",
            left: 20,
            bottom: 20,
          }}
        >
          STATIC ASSET
        </Player.LiveIndicator>
      </Player.Container>
    </Player.Root>
  );
};
