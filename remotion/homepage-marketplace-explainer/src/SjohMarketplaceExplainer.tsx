import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import solarInstaller from "../../../src/assets/solar-installer.jpg";
import steelwork from "../../../src/assets/business/steelwork.jpg";

const COLORS = {
  black: "#050505",
  white: "#FFFFFF",
  muted: "rgba(255,255,255,0.66)",
  gold: "#F5A623",
  red: "#DC2828",
  green: "#0B6E3A",
  navy: "#0A2463",
  peri: "#6B7CE8",
  pink: "#E83E8C",
};

const ACCENTS = [COLORS.gold, COLORS.red, COLORS.green, COLORS.peri, COLORS.pink];
const FPS = 30;
const DURATION = 45 * FPS;
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const ease = Easing.bezier(0.16, 1, 0.3, 1);

type Orientation = "landscape" | "vertical";

const enter = (frame: number, start: number, duration = 26) =>
  interpolate(frame, [start, start + duration], [0, 1], { ...clamp, easing: ease });

const scene = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, start + 22, end - 22, end], [0, 1, 1, 0], {
    ...clamp,
    easing: ease,
  });

const money = (value: number) =>
  `R${Math.round(value).toLocaleString("en-ZA").replace(/,/g, " ")}`;

const Logo = ({ scale = 1 }: { scale?: number }) => {
  const frame = useCurrentFrame();
  const color = ACCENTS[Math.floor(frame / 18) % ACCENTS.length];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        color: COLORS.white,
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        fontSize: 58 * scale,
        fontWeight: 900,
        letterSpacing: -3 * scale,
        lineHeight: 1,
      }}
    >
      sjoh<span style={{ color }}>!</span>
    </div>
  );
};

const Pill = ({
  children,
  color = COLORS.gold,
  dark = false,
}: {
  children: React.ReactNode;
  color?: string;
  dark?: boolean;
}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      borderRadius: 999,
      padding: "12px 18px",
      background: dark ? "rgba(255,255,255,0.08)" : color,
      border: dark ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(0,0,0,0.2)",
      color: dark ? COLORS.white : COLORS.black,
      fontSize: 22,
      fontWeight: 900,
      lineHeight: 1,
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </div>
);

const Phone = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      width: 420,
      height: 790,
      borderRadius: 58,
      padding: 18,
      background: "linear-gradient(145deg, rgba(255,255,255,0.28), rgba(255,255,255,0.06))",
      border: "1px solid rgba(255,255,255,0.30)",
      boxShadow: "0 38px 120px rgba(0,0,0,0.5)",
    }}
  >
    <div
      style={{
        position: "relative",
        height: "100%",
        overflow: "hidden",
        borderRadius: 42,
        background: "#f7f7fa",
        color: COLORS.black,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 14,
          left: "50%",
          zIndex: 20,
          width: 112,
          height: 28,
          borderRadius: 999,
          background: COLORS.black,
          transform: "translateX(-50%)",
        }}
      />
      {children}
    </div>
  </div>
);

const Notification = ({
  title,
  body,
  value,
  color,
  delay,
}: {
  title: string;
  body: string;
  value: string;
  color: string;
  delay: number;
}) => {
  const frame = useCurrentFrame();
  const pop = spring({ frame: frame - delay, fps: FPS, config: { damping: 14, stiffness: 125 } });

  return (
    <div
      style={{
        marginBottom: 16,
        padding: 22,
        borderRadius: 26,
        background: COLORS.white,
        boxShadow: "0 16px 42px rgba(0,0,0,0.13)",
        border: "1px solid rgba(0,0,0,0.07)",
        opacity: interpolate(pop, [0, 0.22], [0, 1], clamp),
        transform: `translateY(${interpolate(pop, [0, 1], [54, 0], clamp)}px) scale(${interpolate(pop, [0, 1], [0.95, 1], clamp)})`,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 18 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 900 }}>{title}</div>
          <div style={{ marginTop: 8, color: "#6a6f7f", fontSize: 17, fontWeight: 750 }}>{body}</div>
        </div>
        <div
          style={{
            flexShrink: 0,
            borderRadius: 17,
            padding: "12px 15px",
            background: color,
            color: color === COLORS.gold ? COLORS.black : COLORS.white,
            fontSize: 22,
            fontWeight: 950,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
};

const InboxScreen = ({ start }: { start: number }) => (
  <div style={{ padding: "74px 28px 28px" }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div>
        <div style={{ color: "#777d8d", fontSize: 15, fontWeight: 950, letterSpacing: 2, textTransform: "uppercase" }}>
          Sjoh inbox
        </div>
        <div style={{ marginTop: 7, fontSize: 38, fontWeight: 950 }}>New work nearby</div>
      </div>
      <div
        style={{
          display: "grid",
          placeItems: "center",
          width: 50,
          height: 50,
          borderRadius: 999,
          background: COLORS.red,
          color: COLORS.white,
          fontSize: 24,
          fontWeight: 950,
        }}
      >
        5
      </div>
    </div>
    <div style={{ marginTop: 24 }}>
      <Notification title="Plumbing repair" body="Sandton • budget shared" value="R850" color={COLORS.gold} delay={start + 10} />
      <Notification title="Electrical COC" body="Rosebank • today" value="R2 400" color={COLORS.peri} delay={start + 38} />
      <Notification title="Website refresh" body="Remote • quote requested" value="R4 800" color={COLORS.pink} delay={start + 66} />
      <Notification title="Garden cleanup" body="Pretoria • 8 km away" value="R1 200" color={COLORS.green} delay={start + 94} />
    </div>
  </div>
);

const QuoteScreen = ({ start }: { start: number }) => {
  const frame = useCurrentFrame();
  const earnings = interpolate(frame, [start + 54, start + 155], [0, 12350], clamp);

  return (
    <div style={{ padding: "74px 28px 28px" }}>
      <div style={{ color: "#777d8d", fontSize: 15, fontWeight: 950, letterSpacing: 2, textTransform: "uppercase" }}>
        Quote dashboard
      </div>
      <div style={{ marginTop: 10, fontSize: 38, fontWeight: 950 }}>Accepted quotes</div>

      <div
        style={{
          marginTop: 24,
          borderRadius: 34,
          padding: 30,
          background: COLORS.black,
          color: COLORS.white,
          boxShadow: "0 18px 55px rgba(0,0,0,0.18)",
        }}
      >
        <div style={{ color: "rgba(255,255,255,0.58)", fontSize: 22, fontWeight: 850 }}>Earned this week</div>
        <div style={{ marginTop: 8, color: COLORS.gold, fontSize: 64, fontWeight: 950, lineHeight: 1 }}>
          {money(earnings)}
        </div>
        <div style={{ marginTop: 22, display: "flex", gap: 12 }}>
          <Pill color={COLORS.green}>R0 commission</Pill>
          <Pill color={COLORS.peri}>4 jobs won</Pill>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <Notification title="Quote accepted" body="Gate motor repair" value="R3 500" color={COLORS.green} delay={start + 25} />
        <Notification title="Quote accepted" body="Inspection booked" value="R1 800" color={COLORS.gold} delay={start + 58} />
      </div>
    </div>
  );
};

const ReviewScreen = ({ start }: { start: number }) => {
  const frame = useCurrentFrame();
  const stars = Math.min(5, Math.max(0, Math.floor((frame - start - 30) / 7)));
  const rating = interpolate(frame, [start + 40, start + 145], [4.4, 4.9], clamp);

  return (
    <div style={{ padding: "74px 28px 28px" }}>
      <div style={{ color: "#777d8d", fontSize: 15, fontWeight: 950, letterSpacing: 2, textTransform: "uppercase" }}>
        Reputation
      </div>
      <div style={{ marginTop: 10, fontSize: 38, fontWeight: 950 }}>Reviews build trust</div>
      <div
        style={{
          marginTop: 24,
          borderRadius: 34,
          padding: 30,
          background: COLORS.white,
          boxShadow: "0 18px 55px rgba(0,0,0,0.14)",
        }}
      >
        <div style={{ color: COLORS.gold, fontSize: 42, letterSpacing: 4 }}>{"★★★★★".slice(0, stars)}</div>
        <div style={{ marginTop: 16, fontSize: 26, fontWeight: 950, lineHeight: 1.18 }}>
          “Showed up on time, clear quote, brilliant work.”
        </div>
        <div style={{ marginTop: 16, color: "#6c7280", fontSize: 18, fontWeight: 800 }}>Customer in Joburg North</div>
      </div>
      <div
        style={{
          marginTop: 18,
          borderRadius: 28,
          padding: 24,
          background: COLORS.navy,
          color: COLORS.white,
        }}
      >
        <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 17, fontWeight: 850 }}>Profile rating</div>
        <div style={{ marginTop: 5, fontSize: 58, fontWeight: 950, lineHeight: 1 }}>{rating.toFixed(1)}</div>
      </div>
    </div>
  );
};

const ProfileScreen = ({ start }: { start: number }) => {
  const frame = useCurrentFrame();
  const views = interpolate(frame, [start + 55, start + 150], [0, 1840], clamp);

  return (
    <div style={{ padding: "74px 28px 28px" }}>
      <div style={{ height: 220, position: "relative", borderRadius: 34, overflow: "hidden" }}>
        <Img src={solarInstaller} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.58))" }} />
        <div
          style={{
            position: "absolute",
            right: 18,
            bottom: 18,
            borderRadius: 999,
            padding: "10px 14px",
            background: COLORS.gold,
            color: COLORS.black,
            fontSize: 17,
            fontWeight: 950,
          }}
        >
          Verified pro
        </div>
      </div>
      <div style={{ marginTop: 24, fontSize: 36, fontWeight: 950 }}>Bright Spark Electrical</div>
      <div style={{ marginTop: 8, color: "#6a6f7f", fontSize: 18, fontWeight: 800 }}>COC • Repairs • Gate motors</div>

      <div style={{ marginTop: 26, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {[
          ["Profile views", Math.round(views).toLocaleString("en-ZA")],
          ["Commission", "0%"],
          ["Rating", "4.9"],
          ["Areas", "9"],
        ].map(([label, value], index) => (
          <div
            key={label}
            style={{
              borderRadius: 26,
              padding: 22,
              background: index === 1 ? COLORS.green : COLORS.white,
              color: index === 1 ? COLORS.white : COLORS.black,
              boxShadow: "0 14px 34px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ color: index === 1 ? "rgba(255,255,255,0.65)" : "#747987", fontSize: 15, fontWeight: 900 }}>{label}</div>
            <div style={{ marginTop: 8, fontSize: 36, fontWeight: 950 }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Title = ({
  eyebrow,
  title,
  body,
  progress,
  compact,
}: {
  eyebrow: string;
  title: React.ReactNode;
  body: string;
  progress: number;
  compact: boolean;
}) => (
  <div
    style={{
      maxWidth: compact ? 850 : 900,
      opacity: progress,
      transform: `translateY(${interpolate(progress, [0, 1], [38, 0])}px)`,
    }}
  >
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        color: COLORS.gold,
        fontSize: compact ? 20 : 24,
        fontWeight: 950,
        letterSpacing: 4,
        textTransform: "uppercase",
      }}
    >
      <span style={{ width: 12, height: 12, borderRadius: 999, background: COLORS.pink }} />
      {eyebrow}
    </div>
    <div
      style={{
        marginTop: 24,
        color: COLORS.white,
        fontSize: compact ? 76 : 96,
        fontWeight: 950,
        letterSpacing: compact ? -4 : -5,
        lineHeight: 0.94,
      }}
    >
      {title}
    </div>
    <div
      style={{
        marginTop: 28,
        color: COLORS.muted,
        fontSize: compact ? 27 : 31,
        fontWeight: 750,
        lineHeight: 1.28,
      }}
    >
      {body}
    </div>
  </div>
);

const Background = ({ orientation }: { orientation: Orientation }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const drift = interpolate(frame, [0, DURATION], [0, orientation === "vertical" ? -150 : -90], clamp);

  return (
    <AbsoluteFill style={{ overflow: "hidden", background: COLORS.black }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
          backgroundSize: "88px 88px",
          transform: `translateY(${drift}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, rgba(5,5,5,0.96) 0%, rgba(5,5,5,0.76) 44%, rgba(5,5,5,0.58) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: width * 0.74,
          height: width * 0.74,
          right: -width * 0.25,
          top: -height * 0.34,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.navy} 0%, transparent 64%)`,
          opacity: 0.42,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: width * 0.55,
          height: width * 0.55,
          left: -width * 0.16,
          bottom: -height * 0.35,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.green} 0%, transparent 64%)`,
          opacity: 0.28,
        }}
      />
    </AbsoluteFill>
  );
};

const ImagePanel = ({ progress, vertical }: { progress: number; vertical: boolean }) => (
  <div
    style={{
      position: "absolute",
      right: vertical ? 105 : 125,
      bottom: vertical ? 210 : 110,
      width: vertical ? 860 : 760,
      height: vertical ? 420 : 520,
      borderRadius: 44,
      overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.18)",
      opacity: progress,
      transform: `translateY(${interpolate(progress, [0, 1], [52, 0])}px) rotate(-1.5deg)`,
      boxShadow: "0 30px 100px rgba(0,0,0,0.42)",
    }}
  >
    <Img src={steelwork} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.76) saturate(1.18)" }} />
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.58))" }} />
    <div style={{ position: "absolute", left: 32, bottom: 32, display: "flex", gap: 14 }}>
      <Pill color={COLORS.gold}>Founding pros</Pill>
      <Pill dark>0% commission</Pill>
    </div>
  </div>
);

export const SjohMarketplaceExplainer = ({ orientation }: { orientation: Orientation }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const vertical = orientation === "vertical";
  const compact = vertical;
  const left = vertical ? 72 : 112;
  const top = vertical ? 120 : 86;
  const titleTop = vertical ? 285 : 245;
  const titleScale = vertical ? 0.82 : 1;

  const s1 = scene(frame, 0, 205);
  const s2 = scene(frame, 165, 430);
  const s3 = scene(frame, 390, 650);
  const s4 = scene(frame, 610, 870);
  const s5 = scene(frame, 830, 1085);
  const s6 = scene(frame, 1045, DURATION);

  const phoneScene = Math.max(s2, s3, s4, s5);
  const phoneX = vertical ? width / 2 - 210 : 1230;
  const phoneY = vertical ? 735 : 145;
  const phoneScale = vertical ? 1.15 : 1.08;

  return (
    <AbsoluteFill style={{ color: COLORS.white, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      <Background orientation={orientation} />

      <div style={{ position: "absolute", top, left, zIndex: 10 }}>
        <Logo scale={vertical ? 1.08 : 1} />
      </div>

      <div
        style={{
          position: "absolute",
          top: vertical ? 128 : 104,
          right: vertical ? 70 : 112,
          display: "flex",
          gap: 12,
          opacity: enter(frame, 12),
        }}
      >
        <Pill color={COLORS.gold}>For businesses</Pill>
        {!vertical && <Pill dark>Keep the whole quote</Pill>}
      </div>

      <div style={{ position: "absolute", left, top: titleTop, transform: `scale(${titleScale})`, transformOrigin: "top left" }}>
        <Title
          eyebrow="Why sign up?"
          title={
            <>
              Why should I sign up for <span style={{ color: COLORS.gold }}>Sjoh?</span>
            </>
          }
          body="Because customers are already looking for someone who can do the job properly. Sjoh helps them find you."
          progress={s1}
          compact={compact}
        />
      </div>

      <div style={{ position: "absolute", left, top: titleTop, transform: `scale(${titleScale})`, transformOrigin: "top left" }}>
        <Title
          eyebrow="Real enquiries"
          title="Work requests land in your inbox."
          body="People post what they need, where they are, photos, timing, and budget. You decide what is worth quoting."
          progress={s2}
          compact={compact}
        />
      </div>

      <div style={{ position: "absolute", left, top: titleTop, transform: `scale(${titleScale})`, transformOrigin: "top left" }}>
        <Title
          eyebrow="Quote and win"
          title="Send quotes. Win jobs. Keep the money."
          body="Accepted quotes turn into booked work, and founding pros keep 100% of the quote with 0% commission."
          progress={s3}
          compact={compact}
        />
      </div>

      <div style={{ position: "absolute", left, top: titleTop, transform: `scale(${titleScale})`, transformOrigin: "top left" }}>
        <Title
          eyebrow="Trust compounds"
          title="Every good job builds your profile."
          body="Reviews, ratings, service areas, photos, and trust signals help the next customer choose you faster."
          progress={s4}
          compact={compact}
        />
      </div>

      <div style={{ position: "absolute", left, top: titleTop, transform: `scale(${titleScale})`, transformOrigin: "top left" }}>
        <Title
          eyebrow="Founding window"
          title="Get in early while Sjoh grows."
          body="Be visible as categories fill up across South Africa, and lock in early business perks."
          progress={s5}
          compact={compact}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: vertical ? 78 : 112,
          top: vertical ? 300 : 238,
          opacity: s6,
          transform: `translateY(${interpolate(s6, [0, 1], [42, 0])}px) scale(${vertical ? 0.76 : 1})`,
          transformOrigin: "top left",
        }}
      >
        <Logo scale={vertical ? 1.85 : 1.55} />
        <div
          style={{
            marginTop: 36,
            maxWidth: vertical ? 1100 : 980,
            fontSize: vertical ? 88 : 106,
            fontWeight: 950,
            letterSpacing: -5,
            lineHeight: 0.93,
          }}
        >
          Get found.<br />
          Get hired.<br />
          Keep the <span style={{ color: COLORS.gold }}>whole quote.</span>
        </div>
        <div style={{ marginTop: 34, display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Pill color={COLORS.gold}>List your business</Pill>
          <Pill dark>sjoh.co.za</Pill>
        </div>
      </div>

      <ImagePanel progress={s1} vertical={vertical} />

      <div
        style={{
          position: "absolute",
          left: phoneX,
          top: phoneY,
          opacity: phoneScene,
          transform: `scale(${phoneScale}) rotate(${interpolate(frame, [165, 1085], [-2.5, 1.5], clamp)}deg)`,
          display: frame < 1095 ? "block" : "none",
        }}
      >
        <Phone>
          {frame < 430 && <InboxScreen start={185} />}
          {frame >= 430 && frame < 650 && <QuoteScreen start={430} />}
          {frame >= 650 && frame < 870 && <ReviewScreen start={650} />}
          {frame >= 870 && <ProfileScreen start={875} />}
        </Phone>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: vertical ? 54 : 46,
          display: "flex",
          justifyContent: "center",
          opacity: interpolate(frame, [38, 82, DURATION - 85, DURATION - 32], [0, 1, 1, 0], clamp),
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: vertical ? 13 : 24,
            borderRadius: 999,
            padding: vertical ? "14px 18px" : "16px 24px",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.16)",
            color: "rgba(255,255,255,0.78)",
            fontSize: vertical ? 19 : 24,
            fontWeight: 950,
          }}
        >
          {["Real enquiries", "Accepted quotes", "Good reviews", "0% commission"].map((item, index) => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: vertical ? 13 : 24 }}>
              {index > 0 && <span style={{ width: 9, height: 9, background: ACCENTS[index], transform: "rotate(45deg)" }} />}
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: "linear-gradient(90deg, rgba(0,0,0,0.40), transparent 20%, transparent 78%, rgba(0,0,0,0.38))",
        }}
      />
    </AbsoluteFill>
  );
};
