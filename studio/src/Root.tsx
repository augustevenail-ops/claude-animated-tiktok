import React from "react";
import { Composition } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";
import { AppelEp1, APPEL_FRAMES } from "./videos/appel/Appel";
import { AppelEp2, APPEL2_FRAMES } from "./videos/appel2/Appel";
import { AppelEp3, APPEL3_FRAMES } from "./videos/appel3/Appel";

export const Root: React.FC = () => (
  <>
    <Composition id="BridgeShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="AppelEp1" component={AppelEp1} durationInFrames={APPEL_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="AppelEp2" component={AppelEp2} durationInFrames={APPEL2_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="AppelEp3" component={AppelEp3} durationInFrames={APPEL3_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
