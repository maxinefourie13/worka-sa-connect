import { Composition, Folder } from "remotion";
import { ProviderPovPromo } from "./ProviderPovPromo";

export const RemotionRoot = () => {
  return (
    <Folder name="Sjoh">
      <Composition
        id="ProviderPovVertical"
        component={ProviderPovPromo}
        durationInFrames={1200}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ layout: "vertical" }}
      />
      <Composition
        id="ProviderPovLandscape"
        component={ProviderPovPromo}
        durationInFrames={1200}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ layout: "landscape" }}
      />
    </Folder>
  );
};
