import React from "react";
import { Composition } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";
import { AreneEp1, ARENE_FRAMES } from "./videos/arene/Arene";
import { DroiteEp1, DROITE_FRAMES } from "./videos/droite/Droite";

export const Root: React.FC = () => (
  <>
    <Composition id="BridgeShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="AreneEp1" component={AreneEp1} durationInFrames={ARENE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="DroiteEp1" component={DroiteEp1} durationInFrames={DROITE_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
