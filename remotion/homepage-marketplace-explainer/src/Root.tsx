import "./index.css";
import { Composition } from "remotion";
import { SjohMarketplaceExplainer } from "./SjohMarketplaceExplainer";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SjohHomepageExplainer"
        component={SjohMarketplaceExplainer}
        durationInFrames={1350}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ orientation: "landscape" }}
      />
      <Composition
        id="SjohHomepageExplainerVertical"
        component={SjohMarketplaceExplainer}
        durationInFrames={1350}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ orientation: "vertical" }}
      />
    </>
  );
};
