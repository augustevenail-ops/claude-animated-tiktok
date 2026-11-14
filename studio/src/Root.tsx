import React from "react";
import { Composition } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";
import { MurEp1, MUR_FRAMES } from "./videos/mur/Mur";
import { MurPlanche } from "./videos/mur/Planche";
import { HopitalPlanche } from "./videos/hopital/Planche";
import { HopitalEp1, HOPITAL_FRAMES } from "./videos/hopital/Hopital";

export const Root: React.FC = () => (
  <>
    <Composition id="BridgeShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="MurPlanche" component={MurPlanche} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="HopitalPlanche" component={HopitalPlanche} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="HopitalEp1" component={HopitalEp1} durationInFrames={HOPITAL_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="MurEp1" component={MurEp1} durationInFrames={MUR_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
