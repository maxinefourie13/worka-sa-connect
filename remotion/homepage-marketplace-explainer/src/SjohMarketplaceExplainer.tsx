import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import heroGroup from "../../../src/assets/hero-group-1.jpg";
import boKaap from "../../../src/assets/bo-kaap.jpg";
import electrician from "../../../src/assets/solar-installer.jpg";

const COLORS = {
  black: "#050505",
  charcoal: "#0B0B0B",
  panel: "#111111",
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

type Orientation = "landscape" | "vertical";

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const ease = Easing.bezier(0.16, 1, 0.3, 1);

const inOut = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, start + 20, end - 20, end], [0, 1, 1, 0], {
    ...clamp,
    easing: ease,
  });

const enter = (frame: number, start: number, duration = 28) =>
  interpolate(frame, [start, start + duration], [0, 1], {
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
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        fontWeight: 900,
        letterSpacing: -3 * scale,
        fontSize: 58 * scale,
        lineHeight: 1,
        color: COLORS.white,
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
      borderRadius: 999,
      padding: "10px 16px",
      background: dark ? "rgba(255,255,255,0.08)" : color,
      color: dark ? COLORS.white : COLORS.black,
      border: dark ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(0,0,0,0.2)",
      fontSize: 22,
      fontWeight: 900,
      lineHeight: 1,
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </div>
);

const PhoneFrame = ({
  children,
  wide = false,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) => (
  <div
    style={{
      width: wide ? 660 : 390,
      height: wide ? 720 : 760,
      borderRadius: 54,
      padding: 18,
      background: "linear-gradient(145deg, rgba(255,255,255,0.24), rgba(255,255,255,0.05))",
      boxShadow: "0 34px 110px rgba(0,0,0,0.48)",
      border: "1px solid rgba(255,255,255,0.28)",
      position: "relative",
    }}
  >
    <div
      style={{
        height: "100%",
        overflow: "hidden",
        borderRadius: 40,
        background: "#f8f8fb",
        color: COLORS.black,
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 14,
          left: "50%",
          transform: "translateX(-50%)",
          width: 110,
          height: 28,
          borderRadius: 999,
          background: "#050505",
          zIndex: 20,
        }}
      />
      {children}
    </div>
  </div>
);

const JobCard = ({
  title,
  meta,
  budget,
  accent,
  delay,
}: {
  title: string;
  meta: string;
  budget: string;
  accent: string;
  delay: number;
}) => {
  const frame = useCurrentFrame();
  const pop = spring({ frame: frame - delay, fps: FPS, config: { damping: 14, stiffness: 120 } });
  return (
    <div
      style={{
        opacity: interpolate(pop, [0, 0.25], [0, 1], clamp),
        transform: `translateY(${interpolate(pop, [0, 1], [50, 0], clamp)}px) scale(${interpolate(pop, [0, 1], [0.94, 1], clamp)})`,
        background: COLORS.white,
        borderRadius: 26,
        padding: 24,
        marginBottom: 16,
        boxShadow: "0 16px 34px rgba(0,0,0,0.13)",
        border: "1px solid rgba(0,0,0,0.07)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 900 }}>{title}</div>
          <div style={{ marginTop: 8, color: "#606575", fontSize: 17, fontWeight: 700 }}>{meta}</div>
        </div>
        <div
          style={{
            borderRadius: 18,
            padding: "13px 16px",
            background: accent,
            color: accent === COLORS.gold ? COLORS.black : COLORS.white,
            fontSize: 24,
            fontWeight: 900,
          }}
        >
          {budget}
        </div>
      </div>
    </div>
  );
};

const ProfileCard = ({ delay }: { delay: number }) => {
  const frame = useCurrentFrame();
  const pop = spring({ frame: frame - delay, fps: FPS, config: { damping: 15, stiffness: 110 } });
  return (
    <div
      style={{
        opacity: interpolate(pop, [0, 0.2], [0, 1], clamp),
        transform: `translateY(${interpolate(pop, [0, 1], [42, 0], clamp)}px)`,
        borderRadius: 34,
        overflow: "hidden",
        background: COLORS.white,
        boxShadow: "0 28px 80px rgba(0,0,0,0.25)",
        width: 440,
      }}
    >
      <div style={{ height: 210, position: "relative" }}>
        <Img src={electrician} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div
          style={{
            position: "absolute",
            right: 18,
            bottom: -30,
            width: 82,
            height: 82,
            borderRadius: 24,
            background: COLORS.gold,
            border: "8px solid white",
            display: "grid",
            placeItems: "center",
            fontSize: 35,
            fontWeight: 900,
          }}
        >
          S
        </div>
      </div>
      <div style={{ padding: "34px 28px 28px" }}>
        <div style={{ fontSize: 31, fontWeight: 900 }}>Bright Spark Electrical</div>
        <div style={{ marginTop: 10, color: "#626879", fontSize: 18, fontWeight: 700 }}>
          Joburg North • COC • Gate motors
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 22, alignItems: "center" }}>
          <Pill color={COLORS.gold}>4.9 rating</Pill>
          <Pill color={COLORS.green}>Verified</Pill>
        </div>
      </div>
    </div>
  );
};

const SearchScreen = ({ start }: { start: number }) => {
  const frame = useCurrentFrame();
  const typed = ["Sparky", "Tiler", "Garden service", "Website refresh"];
  const idx = Math.min(typed.length - 1, Math.floor(Math.max(0, frame - start) / 35));
  return (
    <div style={{ padding: "70px 28px 28px" }}>
      <div style={{ fontSize: 18, fontWeight: 900, color: "#7b8190", textTransform: "uppercase", letterSpacing: 2 }}>
        What can we help you sort out?
      </div>
      <div
        style={{
          marginTop: 20,
          borderRadius: 24,
          padding: 24,
          background: "#fff",
          boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
          fontSize: 28,
          fontWeight: 800,
          color: "#626879",
        }}
      >
        Try '{typed[idx]}'...
      </div>
      <div style={{ marginTop: 26 }}>
        <JobCard title="Post a job once" meta="Add photos, area, and budget" budget="60 sec" accent={COLORS.gold} delay={start + 70} />
      </div>
    </div>
  );
};

const ProviderScreen = ({ start }: { start: number }) => (
  <div style={{ padding: "70px 28px 28px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ fontSize: 36, fontWeight: 900 }}>New requests</div>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 999,
          background: COLORS.red,
          color: COLORS.white,
          display: "grid",
          placeItems: "center",
          fontWeight: 900,
          fontSize: 22,
        }}
      >
        4
      </div>
    </div>
    <div style={{ marginTop: 24 }}>
      <JobCard title="Electrical COC" meta="Rosebank • today" budget="R2 400" accent={COLORS.peri} delay={start + 12} />
      <JobCard title="Garden cleanup" meta="Pretoria • 8 km away" budget="R1 200" accent={COLORS.green} delay={start + 38} />
      <JobCard title="Website refresh" meta="Remote • urgent" budget="R4 800" accent={COLORS.pink} delay={start + 64} />
    </div>
  </div>
);

const QuoteScreen = ({ start }: { start: number }) => {
  const frame = useCurrentFrame();
  const earnings = interpolate(frame, [start + 70, start + 165], [0, 6650], clamp);
  return (
    <div style={{ padding: "70px 28px 28px" }}>
      <div style={{ fontSize: 18, fontWeight: 900, color: "#7b8190", textTransform: "uppercase", letterSpacing: 2 }}>
        Quote dashboard
      </div>
      <div style={{ marginTop: 18, borderRadius: 34, padding: 28, background: COLORS.black, color: COLORS.white }}>
        <div style={{ fontSize: 22, color: "rgba(255,255,255,0.64)", fontWeight: 800 }}>Accepted this week</div>
        <div style={{ marginTop: 8, fontSize: 64, lineHeight: 1, fontWeight: 900, color: COLORS.gold }}>
          {money(earnings)}
        </div>
        <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
          <Pill color={COLORS.green}>R0 commission</Pill>
          <Pill color={COLORS.peri}>4 jobs won</Pill>
        </div>
      </div>
      <div style={{ marginTop: 18 }}>
        <JobCard title="Quote accepted" meta="Electrical inspection" budget="R2 400" accent={COLORS.green} delay={start + 30} />
      </div>
    </div>
  );
};

const ReviewScreen = ({ start }: { start: number }) => {
  const frame = useCurrentFrame();
  const starCount = Math.min(5, Math.max(0, Math.floor((frame - start - 40) / 8)));
  return (
    <div style={{ padding: "70px 28px 28px" }}>
      <div style={{ fontSize: 36, fontWeight: 900 }}>Reviews before you choose</div>
      <div
        style={{
          marginTop: 22,
          borderRadius: 34,
          padding: 28,
          background: COLORS.white,
          boxShadow: "0 14px 40px rgba(0,0,0,0.12)",
        }}
      >
        <div style={{ color: COLORS.gold, fontSize: 38, letterSpacing: 3 }}>
          {"★★★★★".slice(0, starCount)}
        </div>
        <div style={{ marginTop: 18, fontSize: 25, fontWeight: 900, lineHeight: 1.22 }}>
          “Quick, professional, and easy to book. Found them on Sjoh.”
        </div>
        <div style={{ marginTop: 18, color: "#6b7080", fontWeight: 800, fontSize: 18 }}>Customer in Sandton</div>
      </div>
    </div>
  );
};

const StageTitle = ({
  eyebrow,
  title,
  body,
  progress,
  compact = false,
}: {
  eyebrow: string;
  title: React.ReactNode;
  body: string;
  progress: number;
  compact?: boolean;
}) => (
  <div
    style={{
      opacity: progress,
      transform: `translateY(${interpolate(progress, [0, 1], [36, 0])}px)`,
      maxWidth: compact ? 760 : 830,
    }}
  >
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        color: COLORS.gold,
        textTransform: "uppercase",
        letterSpacing: 4,
        fontSize: compact ? 20 : 24,
        fontWeight: 900,
      }}
    >
      <span style={{ width: 12, height: 12, borderRadius: 999, background: COLORS.pink }} />
      {eyebrow}
    </div>
    <div
      style={{
        marginTop: 26,
        fontSize: compact ? 70 : 88,
        lineHeight: 0.96,
        fontWeight: 900,
        letterSpacing: -4,
        color: COLORS.white,
      }}
    >
      {title}
    </div>
    <div
      style={{
        marginTop: 26,
        fontSize: compact ? 26 : 30,
        lineHeight: 1.32,
        fontWeight: 700,
        color: COLORS.muted,
      }}
    >
      {body}
    </div>
  </div>
);

const Background = ({ orientation }: { orientation: Orientation }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const drift = interpolate(frame, [0, DURATION], [0, orientation === "vertical" ? -160 : -90], clamp);
  return (
    <AbsoluteFill style={{ background: COLORS.black, overflow: "hidden" }}>
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
          width: width * 0.75,
          height: width * 0.75,
          right: -width * 0.28,
          top: -height * 0.2,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.navy} 0%, transparent 62%)`,
          opacity: 0.42,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: width * 0.5,
          height: width * 0.5,
          left: -width * 0.16,
          bottom: -height * 0.18,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.green} 0%, transparent 64%)`,
          opacity: 0.28,
        }}
      />
    </AbsoluteFill>
  );
};

const MapMoment = ({ start, vertical }: { start: number; vertical: boolean }) => {
  const frame = useCurrentFrame();
  const dots = [
    { x: 30, y: 34, c: COLORS.gold, label: "Job posted" },
    { x: 54, y: 50, c: COLORS.peri, label: "3 quotes" },
    { x: 68, y: 38, c: COLORS.green, label: "Pro nearby" },
    { x: 45, y: 68, c: COLORS.pink, label: "Reviews checked" },
  ];
  return (
    <div
      style={{
        width: vertical ? 840 : 740,
        height: vertical ? 520 : 540,
        borderRadius: 42,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.18)",
        position: "relative",
        boxShadow: "0 24px 90px rgba(0,0,0,0.4)",
      }}
    >
      <Img src={boKaap} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(1.15) brightness(0.74)" }} />
      <div style={{ position: "absolute", inset: 0, background: "rgba(5,5,5,0.38)" }} />
      {dots.map((dot, i) => {
        const pop = spring({ frame: frame - start - i * 18, fps: FPS, config: { damping: 12, stiffness: 120 } });
        return (
          <div
            key={dot.label}
            style={{
              position: "absolute",
              left: `${dot.x}%`,
              top: `${dot.y}%`,
              opacity: interpolate(pop, [0, 0.2], [0, 1], clamp),
              transform: `translate(-50%, -50%) scale(${interpolate(pop, [0, 1], [0.2, 1], clamp)})`,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                background: dot.c,
                border: "5px solid white",
                boxShadow: `0 0 0 ${interpolate(frame, [start + i * 18, start + i * 18 + 35], [0, 36], clamp)}px rgba(255,255,255,0.08)`,
              }}
            />
            <div
              style={{
                marginTop: 12,
                marginLeft: -40,
                background: COLORS.white,
                color: COLORS.black,
                borderRadius: 999,
                padding: "10px 14px",
                fontSize: 17,
                fontWeight: 900,
                whiteSpace: "nowrap",
              }}
            >
              {dot.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const SjohMarketplaceExplainer = ({ orientation }: { orientation: Orientation }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const vertical = orientation === "vertical";
  const scale = vertical ? 0.72 : 1;
  const left = vertical ? 76 : 110;
  const top = vertical ? 110 : 86;

  const s1 = inOut(frame, 0, 170);
  const s2 = inOut(frame, 130, 360);
  const s3 = inOut(frame, 320, 570);
  const s4 = inOut(frame, 535, 780);
  const s5 = inOut(frame, 740, 1010);
  const s6 = inOut(frame, 980, DURATION);

  const phoneMove = interpolate(frame, [130, 360, 570, 780, 1010], [0, 1, 2, 3, 4], clamp);
  const phoneX = vertical
    ? width / 2 - 195
    : interpolate(phoneMove, [0, 1, 2, 3, 4], [1120, 1110, 1120, 1100, 1160], clamp);
  const phoneY = vertical
    ? interpolate(phoneMove, [0, 1, 2, 3, 4], [610, 700, 700, 705, 690], clamp)
    : 176;
  const phoneScale = vertical ? 1.18 : 1.02;

  return (
    <AbsoluteFill style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: COLORS.white }}>
      <Background orientation={orientation} />

      <div style={{ position: "absolute", top, left, zIndex: 10 }}>
        <Logo scale={vertical ? 1.05 : 1} />
      </div>

      <div
        style={{
          position: "absolute",
          right: vertical ? 70 : 110,
          top: vertical ? 122 : 104,
          display: "flex",
          gap: 12,
          alignItems: "center",
          opacity: enter(frame, 15),
        }}
      >
        <Pill dark>No middleman</Pill>
        {!vertical && <Pill color={COLORS.gold}>0% commission</Pill>}
      </div>

      <div
        style={{
          position: "absolute",
          left,
          top: vertical ? 290 : 260,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <StageTitle
          eyebrow="One job. Two wins."
          title={
            <>
              Find the right <span style={{ color: COLORS.gold }}>pro</span> fast.
            </>
          }
          body="Sjoh connects people who need work done with local businesses ready to quote."
          progress={s1}
          compact={vertical}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left,
          top: vertical ? 260 : 258,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          pointerEvents: "none",
        }}
      >
        <StageTitle
          eyebrow="Customer side"
          title={
            <>
              Search, or post once.
            </>
          }
          body="Tell Sjoh what you need. Add the area, photos, and budget, then let the marketplace do the sorting."
          progress={s2}
          compact={vertical}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left,
          top: vertical ? 260 : 258,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          pointerEvents: "none",
        }}
      >
        <StageTitle
          eyebrow="Provider side"
          title={
            <>
              Local pros get real enquiries.
            </>
          }
          body="The right businesses see nearby jobs, send quotes, and keep the full amount."
          progress={s3}
          compact={vertical}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left,
          top: vertical ? 245 : 236,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          pointerEvents: "none",
        }}
      >
        <StageTitle
          eyebrow="Trust before choosing"
          title={
            <>
              Compare quotes, reviews, and profiles.
            </>
          }
          body="Customers can see ratings, previous work, service areas, and trust signals before they choose."
          progress={s4}
          compact={vertical}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left,
          top: vertical ? 245 : 244,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          pointerEvents: "none",
        }}
      >
        <StageTitle
          eyebrow="Marketplace moment"
          title={
            <>
              Customers get sorted. Pros get hired.
            </>
          }
          body="One simple flow creates confidence for customers and new work for service providers."
          progress={s5}
          compact={vertical}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: vertical ? 78 : 112,
          top: vertical ? 285 : 252,
          opacity: s6,
          transform: `translateY(${interpolate(s6, [0, 1], [40, 0])}px) scale(${vertical ? 0.78 : 1})`,
          transformOrigin: "top left",
        }}
      >
        <div style={{ maxWidth: vertical ? 980 : 900 }}>
          <Logo scale={vertical ? 1.8 : 1.55} />
          <div
            style={{
              marginTop: 34,
              fontSize: vertical ? 86 : 96,
              lineHeight: 0.96,
              fontWeight: 900,
              letterSpacing: -5,
            }}
          >
            Find the skill.<br />
            Check the reviews.<br />
            Get it <span style={{ color: COLORS.gold }}>sorted.</span>
          </div>
          <div style={{ marginTop: 34, color: COLORS.muted, fontSize: 30, fontWeight: 800 }}>
            sjoh.co.za
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: vertical ? 120 : 780,
          bottom: vertical ? 180 : 120,
          opacity: s1,
          transform: `translateY(${interpolate(s1, [0, 1], [60, 0])}px)`,
          display: frame < 190 ? "block" : "none",
        }}
      >
        <div
          style={{
            width: vertical ? 840 : 900,
            height: vertical ? 440 : 520,
            borderRadius: 46,
            overflow: "hidden",
            position: "relative",
            border: "1px solid rgba(255,255,255,0.18)",
          }}
        >
          <Img src={heroGroup} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.75) saturate(1.15)" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.48))" }} />
          <div style={{ position: "absolute", left: 34, bottom: 32, display: "flex", gap: 14 }}>
            <Pill color={COLORS.gold}>Post a job</Pill>
            <Pill dark>Browse vetted pros</Pill>
            <Pill dark>List your business</Pill>
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: phoneX,
          top: phoneY,
          opacity: Math.max(s2, s3, s4, s5),
          transform: `scale(${phoneScale}) rotate(${interpolate(frame, [130, 1010], [-2, 1.5], clamp)}deg)`,
          transformOrigin: "center",
          display: frame < 1040 ? "block" : "none",
        }}
      >
        <PhoneFrame>
          {frame < 360 && <SearchScreen start={150} />}
          {frame >= 360 && frame < 570 && <ProviderScreen start={355} />}
          {frame >= 570 && frame < 780 && <ReviewScreen start={570} />}
          {frame >= 780 && <QuoteScreen start={790} />}
        </PhoneFrame>
      </div>

      <div
        style={{
          position: "absolute",
          right: vertical ? 120 : 108,
          bottom: vertical ? 170 : 116,
          opacity: s4,
          transform: `translateY(${interpolate(s4, [0, 1], [44, 0])}px)`,
          display: frame >= 535 && frame < 805 ? "block" : "none",
        }}
      >
        <ProfileCard delay={545} />
      </div>

      <div
        style={{
          position: "absolute",
          right: vertical ? 120 : 108,
          bottom: vertical ? 190 : 124,
          opacity: s5,
          display: frame >= 740 && frame < 1040 ? "block" : "none",
        }}
      >
        <MapMoment start={760} vertical={vertical} />
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: vertical ? 54 : 46,
          display: "flex",
          justifyContent: "center",
          opacity: interpolate(frame, [40, 80, DURATION - 80, DURATION - 30], [0, 1, 1, 0], clamp),
        }}
      >
        <div
          style={{
            display: "flex",
            gap: vertical ? 14 : 24,
            alignItems: "center",
            borderRadius: 999,
            padding: vertical ? "14px 18px" : "16px 24px",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.16)",
            fontSize: vertical ? 20 : 24,
            fontWeight: 900,
            color: "rgba(255,255,255,0.78)",
          }}
        >
          {["Find a pro", "Get quotes", "0% commission", "All 9 provinces"].map((item, i) => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: vertical ? 14 : 24 }}>
              {i > 0 && <span style={{ width: 9, height: 9, transform: "rotate(45deg)", background: ACCENTS[i] }} />}
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
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.42) 0%, transparent 18%, transparent 82%, rgba(0,0,0,0.42) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
