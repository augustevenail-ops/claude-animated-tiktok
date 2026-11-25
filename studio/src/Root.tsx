import React from "react";
import { Composition } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";
import { MurEp1, MUR_FRAMES } from "./videos/mur/Mur";
import { MurPlanche } from "./videos/mur/Planche";
import { Bunker, BunkerCaps, BUNKER_FRAMES, BW, BH } from "./videos/bunker/Bunker";
import { Monstre, MONSTRE_FRAMES, MW, MH } from "./videos/monstre/Monstre";
import { AppelStill, APPEL_W, APPEL_H } from "./videos/appel/Appel";

export const Root: React.FC = () => (
  <>
    <Composition id="BridgeShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="MurPlanche" component={MurPlanche} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="MurEp1" component={MurEp1} durationInFrames={MUR_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Bunker" component={Bunker} durationInFrames={BUNKER_FRAMES} fps={30} width={BW} height={BH} />
      <Composition id="BunkerCaps" component={BunkerCaps} durationInFrames={BUNKER_FRAMES} fps={30} width={BW} height={BH} />
    <Composition id="Monstre" component={Monstre} durationInFrames={MONSTRE_FRAMES} fps={30} width={MW} height={MH} />
    <Composition id="AppelStill" component={AppelStill} durationInFrames={7} fps={30} width={APPEL_W} height={APPEL_H} defaultProps={{ scene: 1 }} />
  </>
);
