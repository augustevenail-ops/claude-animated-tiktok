import React from "react";
import { Composition } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";
import { MurEp1, MUR_FRAMES } from "./videos/mur/Mur";
import { MurPlanche } from "./videos/mur/Planche";
import { PuitsEp1, PUITS_FRAMES } from "./videos/puits/Puits";

export const Root: React.FC = () => (
  <>
    <Composition id="BridgeShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="MurPlanche" component={MurPlanche} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="MurEp1" component={MurEp1} durationInFrames={MUR_FRAMES} fps={30} width={1080} height={1920} />
    {/* rendu partiel : liste d'images de PuitsEp1 (prop « frames »), recollées ensuite dans le rendu complet */}
    <Composition id="PuitsPatch" component={PuitsEp1} defaultProps={{ frames: [0] }} fps={30} width={1080} height={1920}
      durationInFrames={1} calculateMetadata={({ props }) => ({ durationInFrames: Math.max(1, (props.frames as number[]).length) })} />
    <Composition id="PuitsEp1" component={PuitsEp1} durationInFrames={PUITS_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
