import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type ProviderPovPromoProps = {
  layout: "vertical" | "landscape";
};

const SA = {
  red: "#E52329",
  navy: "#0A2463",
  green: "#007A41",
  gold: "#FFB41F",
  peri: "#6B7CE8",
  pink: "#E83E8C",
  dark: "#050505",
  ink: "#101010",
};

const jobs = [
  { title: "Plumbing repair", area: "Sandton", budget: "R850", color: SA.pink, start: 0.8 },
  { title: "Garden cleanup", area: "Pretoria", budget: "R1,200", color: SA.green, start: 2.15 },
  { title: "Electrical inspection", area: "Joburg North", budget: "R2,400", color: SA.gold, start: 3.45 },
  { title: "Website refresh", area: "Rosebank", budget: "R4,800", color: SA.peri, start: 5.1 },
];

const acceptedQuotes = [
  { title: "Quote accepted", amount: "R3,500", client: "Blocked drain · Bryanston", start: 14.0 },
  { title: "Quote accepted", amount: "R1,800", client: "Garden cleanup · Pretoria", start: 16.3 },
];

const reviews = [
  { text: "Showed up on time. Professional, neat work.", start: 20.0 },
  { text: "Best plumber I’ve hired. Found him on Sjoh.", start: 22.1 },
  { text: "Highly recommend. Quick quote, fair price.", start: 24.1 },
];

const palette = [SA.gold, SA.red, SA.peri, SA.green, SA.pink];

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const useSeconds = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return { frame, fps, seconds: frame / fps };
};

const enter = (frame: number, fps: number, start: number, duration = 0.55) =>
  interpolate(frame, [start * fps, (start + duration) * fps], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

const pop = (frame: number, fps: number, start: number) =>
  spring({
    frame: frame - start * fps,
    fps,
    config: { damping: 15, stiffness: 130, mass: 0.8 },
    durationInFrames: 22,
  });

const currency = (value: number) =>
  `R${Math.round(value).toLocaleString("en-ZA").replace(/,/g, " ")}`;

const SjohWordmark = ({ size = 76 }: { size?: number }) => {
  const { frame, fps } = useSeconds();
  const colorIndex = Math.floor((frame / fps) * 1.2) % palette.length;
  return (
    <div style={{ fontSize: size, fontWeight: 950, letterSpacing: -2, lineHeight: 1 }}>
      <span>sjoh</span>
      <span style={{ color: palette[colorIndex] }}>!</span>
    </div>
  );
};

const FloatingShape = ({
  x,
  y,
  size,
  color,
  delay,
}: {
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
}) => {
  const { frame, fps } = useSeconds();
  const drift = Math.sin(frame / fps + delay) * 10;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + drift,
        width: size,
        height: size,
        borderRadius: size * 0.25,
        background: color,
        transform: `rotate(${45 + drift}deg)`,
        opacity: 0.9,
        filter: "blur(0.1px)",
      }}
    />
  );
};

const JobCard = ({ job, index }: { job: (typeof jobs)[number]; index: number }) => {
  const { frame, fps } = useSeconds();
  const p = pop(frame, fps, job.start);
  const opacity = enter(frame, fps, job.start, 0.35);
  const y = interpolate(p, [0, 1], [54, 0]);
  const scale = interpolate(p, [0, 1], [0.94, 1]);

  return (
    <div
      style={{
        marginTop: index === 0 ? 0 : 18,
        opacity,
        transform: `translateY(${y}px) scale(${scale})`,
        borderRadius: 28,
        background: "rgba(255,255,255,0.94)",
        color: SA.ink,
        padding: 24,
        boxShadow: "0 22px 50px rgba(0,0,0,0.22)",
        border: "1px solid rgba(255,255,255,0.68)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 16,
            background: job.color,
            display: "grid",
            placeItems: "center",
            color: "white",
            fontWeight: 950,
            fontSize: 22,
          }}
        >
          +
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: "rgba(16,16,16,0.48)", textTransform: "uppercase", letterSpacing: 2 }}>
            New job request
          </div>
          <div style={{ marginTop: 4, fontSize: 27, fontWeight: 950, lineHeight: 1.08 }}>{job.title}</div>
          <div style={{ marginTop: 6, fontSize: 19, color: "rgba(16,16,16,0.62)" }}>{job.area} · {job.budget} budget</div>
        </div>
      </div>
    </div>
  );
};

const EmailPing = () => {
  const { frame, fps } = useSeconds();
  const p = pop(frame, fps, 8);
  const opacity = enter(frame, fps, 8, 0.45);
  const y = interpolate(p, [0, 1], [-110, 0]);

  return (
    <div
      style={{
        position: "absolute",
        left: 30,
        right: 30,
        top: 28,
        opacity,
        transform: `translateY(${y}px)`,
        borderRadius: 28,
        background: "rgba(245,247,255,0.96)",
        color: SA.ink,
        padding: "18px 20px",
        border: "1px solid rgba(255,255,255,0.72)",
        boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "rgba(16,16,16,0.52)", fontWeight: 800 }}>
        <span>Sjoh Opportunities</span>
        <span>now</span>
      </div>
      <div style={{ marginTop: 6, fontSize: 22, fontWeight: 950 }}>5 new jobs in your area this week</div>
      <div style={{ marginTop: 7, fontSize: 15, color: "rgba(16,16,16,0.62)" }}>Plumbing, electrical, garden work · budgets from R850 to R4,800</div>
    </div>
  );
};

const QuoteAccepted = ({ quote, index }: { quote: (typeof acceptedQuotes)[number]; index: number }) => {
  const { frame, fps } = useSeconds();
  const p = pop(frame, fps, quote.start);
  const opacity = enter(frame, fps, quote.start, 0.35);
  const x = interpolate(p, [0, 1], [70, 0]);

  return (
    <div
      style={{
        opacity,
        transform: `translateX(${x}px)`,
        marginTop: index === 0 ? 0 : 16,
        borderRadius: 28,
        background: "linear-gradient(135deg, #0a7a42, #14a765)",
        color: "white",
        padding: 24,
        boxShadow: "0 18px 42px rgba(0,122,65,0.28)",
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 950, textTransform: "uppercase", letterSpacing: 2, opacity: 0.7 }}>{quote.title}</div>
      <div style={{ marginTop: 4, fontSize: 48, fontWeight: 950, lineHeight: 1 }}>{quote.amount}</div>
      <div style={{ marginTop: 7, fontSize: 17, opacity: 0.78 }}>{quote.client}</div>
      <div style={{ marginTop: 14, fontSize: 15, fontWeight: 900, color: SA.gold }}>0% commission taken</div>
    </div>
  );
};

const ReviewCard = ({ review, index }: { review: (typeof reviews)[number]; index: number }) => {
  const { frame, fps } = useSeconds();
  const p = pop(frame, fps, review.start);
  const opacity = enter(frame, fps, review.start, 0.35);
  const y = interpolate(p, [0, 1], [48, 0]);
  const stars = Math.min(5, Math.max(0, Math.floor((frame - review.start * fps) / 4)));

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${y}px) rotate(${index === 1 ? -1.2 : index === 2 ? 1.2 : 0}deg)`,
        marginTop: index === 0 ? 0 : 14,
        borderRadius: 26,
        background: "rgba(255,255,255,0.94)",
        color: SA.ink,
        padding: 22,
        boxShadow: "0 14px 36px rgba(0,0,0,0.18)",
      }}
    >
      <div style={{ display: "flex", gap: 4, color: SA.gold, fontSize: 25, letterSpacing: 2 }}>
        {"★★★★★".split("").map((star, i) => (
          <span key={i} style={{ opacity: i < stars ? 1 : 0.18 }}>{star}</span>
        ))}
      </div>
      <div style={{ marginTop: 10, fontSize: 20, fontWeight: 800, lineHeight: 1.24 }}>&ldquo;{review.text}&rdquo;</div>
    </div>
  );
};

const PhoneScreen = () => {
  const { frame, fps, seconds } = useSeconds();
  const unread = Math.min(jobs.length, jobs.filter((job) => seconds >= job.start).length);
  const showQuotes = seconds >= 14;
  const showReviews = seconds >= 20;
  const showMoney = seconds >= 28;
  const showEnd = seconds >= 34;
  const totalEarned = interpolate(frame, [28 * fps, 34 * fps], [4500, 12350], clamp);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: 72,
        background: "linear-gradient(180deg, #f8f8f8 0%, #e7edf6 100%)",
        overflow: "hidden",
        color: SA.ink,
      }}
    >
      <div style={{ height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 36px", fontSize: 17, fontWeight: 900 }}>
        <span>9:41</span>
        <span style={{ letterSpacing: 3 }}>•••</span>
      </div>
      <div style={{ padding: "8px 34px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ color: SA.peri, fontSize: 15, fontWeight: 950, textTransform: "uppercase", letterSpacing: 2 }}>Sjoh Pro</div>
            <div style={{ marginTop: 4, fontSize: 34, fontWeight: 950 }}>Your inbox</div>
          </div>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 18,
              background: unread ? SA.pink : SA.ink,
              color: "white",
              display: "grid",
              placeItems: "center",
              fontSize: 24,
              fontWeight: 950,
            }}
          >
            {unread}
          </div>
        </div>

        <div style={{ marginTop: 28 }}>
          {!showQuotes && jobs.map((job, index) => <JobCard key={job.title} job={job} index={index} />)}

          {showQuotes && !showReviews && (
            <>
              <div style={{ marginBottom: 18, fontSize: 15, fontWeight: 950, letterSpacing: 2, color: "rgba(16,16,16,0.45)", textTransform: "uppercase" }}>Accepted quotes</div>
              {acceptedQuotes.map((quote, index) => <QuoteAccepted key={quote.amount} quote={quote} index={index} />)}
              <div style={{ marginTop: 20, borderRadius: 28, background: SA.ink, color: "white", padding: 24 }}>
                <div style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", fontWeight: 900, textTransform: "uppercase", letterSpacing: 2 }}>Pipeline this week</div>
                <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div><strong style={{ fontSize: 38 }}>11</strong><br /><span style={{ opacity: 0.55 }}>requests</span></div>
                  <div><strong style={{ fontSize: 38 }}>6</strong><br /><span style={{ opacity: 0.55 }}>accepted</span></div>
                </div>
              </div>
            </>
          )}

          {showReviews && !showMoney && (
            <>
              <div style={{ marginBottom: 18, fontSize: 15, fontWeight: 950, letterSpacing: 2, color: "rgba(16,16,16,0.45)", textTransform: "uppercase" }}>Reviews rolling in</div>
              {reviews.map((review, index) => <ReviewCard key={review.text} review={review} index={index} />)}
            </>
          )}

          {showMoney && !showEnd && (
            <div style={{ marginTop: 18, borderRadius: 36, background: "linear-gradient(135deg, #063f25, #009651)", color: "white", padding: 32, minHeight: 520 }}>
              <div style={{ fontSize: 16, fontWeight: 950, textTransform: "uppercase", letterSpacing: 2, opacity: 0.65 }}>Earned this week</div>
              <div style={{ marginTop: 18, fontSize: 80, fontWeight: 950, lineHeight: 1, color: SA.gold }}>{currency(totalEarned)}</div>
              <div style={{ marginTop: 20, borderRadius: 26, background: "rgba(255,255,255,0.13)", padding: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, fontWeight: 900 }}>
                  <span>Commission</span>
                  <span>R0</span>
                </div>
                <div style={{ marginTop: 12, height: 12, borderRadius: 999, background: "rgba(255,255,255,0.18)", overflow: "hidden" }}>
                  <div style={{ width: "100%", height: "100%", background: SA.gold }} />
                </div>
                <div style={{ marginTop: 10, fontSize: 16, opacity: 0.7 }}>You keep the quote. Sjoh does not take a cut.</div>
              </div>
              <div style={{ marginTop: 26, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Metric value="24" label="profile views" />
                <Metric value="5.0" label="avg rating" />
              </div>
            </div>
          )}

          {showEnd && (
            <div style={{ marginTop: 40, textAlign: "center", padding: "70px 20px" }}>
              <SjohWordmark size={92} />
              <div style={{ marginTop: 36, fontSize: 54, lineHeight: 1, fontWeight: 950 }}>Your next client is already waiting.</div>
              <div style={{ marginTop: 22, fontSize: 23, color: "rgba(16,16,16,0.58)", lineHeight: 1.24 }}>Join Sjoh, South Africa’s service marketplace.</div>
              <div style={{ marginTop: 32, display: "inline-flex", borderRadius: 999, padding: "17px 28px", background: SA.gold, color: SA.ink, fontWeight: 950, fontSize: 20 }}>sjoh.co.za</div>
            </div>
          )}
        </div>
      </div>
      <EmailPing />
    </div>
  );
};

const Metric = ({ value, label }: { value: string; label: string }) => (
  <div style={{ borderRadius: 24, background: "rgba(255,255,255,0.12)", padding: 20 }}>
    <div style={{ fontSize: 38, fontWeight: 950 }}>{value}</div>
    <div style={{ marginTop: 3, fontSize: 15, opacity: 0.65, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 850 }}>{label}</div>
  </div>
);

const Phone = ({ layout }: ProviderPovPromoProps) => {
  const { frame, fps } = useSeconds();
  const intro = enter(frame, fps, 0, 1.1);
  const float = Math.sin(frame / fps * 1.2) * 10;
  const isVertical = layout === "vertical";
  const phoneWidth = isVertical ? 720 : 560;
  const phoneHeight = isVertical ? 1420 : 930;

  return (
    <div
      style={{
        position: "relative",
        width: phoneWidth,
        height: phoneHeight,
        borderRadius: 92,
        padding: 22,
        background: "linear-gradient(145deg, #20242b, #020202)",
        boxShadow: "0 55px 120px rgba(0,0,0,0.58), 0 0 0 2px rgba(255,255,255,0.12)",
        transform: `translateY(${interpolate(intro, [0, 1], [70, float])}px) scale(${interpolate(intro, [0, 1], [0.92, 1])})`,
        opacity: intro,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 26,
          left: "50%",
          transform: "translateX(-50%)",
          width: 190,
          height: 34,
          borderRadius: 999,
          background: "#050505",
          zIndex: 4,
        }}
      />
      <PhoneScreen />
    </div>
  );
};

const SideCopy = ({ layout }: ProviderPovPromoProps) => {
  const { frame, fps, seconds } = useSeconds();
  const p = enter(frame, fps, 0.2, 1);
  const endP = enter(frame, fps, 34, 1);
  const isVertical = layout === "vertical";
  const headline = seconds < 28 ? "Your phone after joining Sjoh." : "Keep the whole quote.";

  return (
    <div
      style={{
        maxWidth: isVertical ? 760 : 610,
        color: "white",
        opacity: interpolate(p, [0, 1], [0, 1]),
        transform: `translateY(${interpolate(p, [0, 1], [38, 0])}px)`,
      }}
    >
      <div style={{ display: "inline-flex", alignItems: "center", gap: 12, borderRadius: 999, border: "1px solid rgba(255,255,255,0.13)", background: "rgba(255,255,255,0.06)", padding: "12px 18px", color: SA.gold, fontSize: 18, fontWeight: 950, letterSpacing: 2, textTransform: "uppercase" }}>
        Provider POV
      </div>
      <div style={{ marginTop: 28, fontSize: isVertical ? 74 : 82, lineHeight: 0.94, letterSpacing: -3, fontWeight: 950 }}>
        {headline}
      </div>
      <div style={{ marginTop: 26, fontSize: isVertical ? 27 : 28, lineHeight: 1.23, color: "rgba(255,255,255,0.68)", fontWeight: 650 }}>
        New requests, accepted quotes, five-star reviews, and zero commission. Sjoh gives good local businesses a better place to get found.
      </div>
      <div style={{ marginTop: 34, display: "flex", gap: 14, flexWrap: "wrap", opacity: 1 - endP * 0.4 }}>
        {["Ready-to-quote leads", "Accepted jobs", "Five-star proof", "0% commission"].map((item, i) => (
          <div key={item} style={{ borderRadius: 999, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", padding: "13px 18px", fontSize: 17, fontWeight: 850, color: i === 3 ? SA.gold : "rgba(255,255,255,0.78)" }}>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
};

export const ProviderPovPromo = ({ layout }: ProviderPovPromoProps) => {
  const isVertical = layout === "vertical";

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 18% 14%, rgba(232,62,140,0.22), transparent 28%),
          radial-gradient(circle at 82% 18%, rgba(107,124,232,0.24), transparent 30%),
          radial-gradient(circle at 50% 100%, rgba(0,122,65,0.2), transparent 34%),
          ${SA.dark}`,
        fontFamily: "Inter, Arial, Helvetica, sans-serif",
        overflow: "hidden",
      }}
    >
      <FloatingShape x={isVertical ? 76 : 110} y={isVertical ? 220 : 120} size={42} color={SA.gold} delay={0} />
      <FloatingShape x={isVertical ? 910 : 1720} y={isVertical ? 330 : 830} size={34} color={SA.pink} delay={1.4} />
      <FloatingShape x={isVertical ? 130 : 1500} y={isVertical ? 1600 : 170} size={26} color={SA.green} delay={2.1} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.11,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: isVertical ? "78px 70px" : "70px 92px",
          display: "grid",
          gridTemplateColumns: isVertical ? "1fr" : "0.92fr 1fr",
          gap: isVertical ? 52 : 86,
          alignItems: "center",
          justifyItems: "center",
        }}
      >
        <SideCopy layout={layout} />
        <Phone layout={layout} />
      </div>
    </AbsoluteFill>
  );
};
