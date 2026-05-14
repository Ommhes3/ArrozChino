import { useEffect, useState } from "react";

type LiveVideo = {
  src: string;
  title?: string;
};

type LiveStreamCardProps = {
  videos?: LiveVideo[];
  sleepingImageSrc?: string;
  onLiveStatusChange?: (isLive: boolean) => void;
};

export default function LiveStreamCard({
  videos = [
    {
      src: "/stream.mp4",
      title: "Vista del comedero",
    },
  ],
  sleepingImageSrc = "/logoDormido.png",
  onLiveStatusChange,
}: LiveStreamCardProps) {
  const [isLive, setIsLive] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewers, setViewers] = useState(() => randomViewers());

  const hasVideos = videos.length > 0;
  const activeVideo = hasVideos ? videos[activeIndex] : null;
  const shouldShowLive = hasVideos && isLive && activeVideo;

  useEffect(() => {
    onLiveStatusChange?.(isLive);
  }, [isLive, onLiveStatusChange]);

  useEffect(() => {
    if (!shouldShowLive) return;

    const interval = window.setInterval(() => {
      setViewers((current) => {
        const variation = randomBetween(-6, 8);
        const nextValue = current + variation;

        if (nextValue < 8) return 8;
        if (nextValue > 180) return 180;

        return nextValue;
      });
    }, 3500);

    return () => window.clearInterval(interval);
  }, [shouldShowLive]);

  function goToNextVideo() {
    setActiveIndex((currentIndex) =>
      getNextVideoIndex(currentIndex, videos.length)
    );

    setViewers(randomViewers());
  }

  function handleVideoEnded() {
    const turnOffProbability = 0.35;
    const shouldTurnOff = Math.random() < turnOffProbability;

    if (shouldTurnOff) {
      setIsLive(false);
      setViewers(0);

      const restartTime = randomBetween(4000, 9000);

      window.setTimeout(() => {
        goToNextVideo();
        setIsLive(true);
      }, restartTime);

      return;
    }

    goToNextVideo();
  }

  function handleVideoError() {
    console.log("No se pudo cargar el video:", activeVideo?.src);

    if (videos.length <= 1) {
      setIsLive(false);
      setViewers(0);
      return;
    }

    goToNextVideo();
  }

  return (
    <section
      style={{
        width: "100%",
        padding: "16px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "760px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "16 / 9",
            backgroundColor: shouldShowLive ? "#000000" : "#FFF7E8",
            border: "6px solid black",
            borderRadius: "34px",
            overflow: "hidden",
            boxShadow: "5px 5px 0px #000",
          }}
        >
          {shouldShowLive ? (
            <video
              key={activeVideo.src}
              src={activeVideo.src}
              autoPlay
              muted
              playsInline
              onEnded={handleVideoEnded}
              onError={handleVideoError}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                background:
                  "radial-gradient(circle at top left, #FFE8F7 0%, transparent 35%), radial-gradient(circle at bottom right, #EAF0FF 0%, transparent 35%), #FFF7E8",
              }}
            >
              <img
                src={sleepingImageSrc}
                alt="Gatito dormido"
                style={{
                  width: "180px",
                  maxWidth: "55%",
                  objectFit: "contain",
                }}
              />

              <p
                style={{
                  margin: 0,
                  fontSize: "24px",
                  fontWeight: 900,
                  color: "black",
                  textAlign: "center",
                }}
              >
                Transmisión pausada
              </p>

              <p
                style={{
                  margin: 0,
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#6B7280",
                  textAlign: "center",
                }}
              >
                El gatito está descansando
              </p>
            </div>
          )}

          {/* Borde doble tipo dibujo */}
          <div
            style={{
              position: "absolute",
              inset: "8px",
              border: "3px solid black",
              borderRadius: "26px",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "absolute",
              inset: "13px",
              border: "2px solid black",
              borderRadius: "22px",
              pointerEvents: "none",
              opacity: 0.55,
            }}
          />

          {/* REC / OFF */}
          <div
            style={{
              position: "absolute",
              top: "22px",
              left: "26px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              zIndex: 10,
            }}
          >
            <span
              style={{
                width: "16px",
                height: "16px",
                borderRadius: "999px",
                backgroundColor: shouldShowLive ? "#EF4444" : "#9CA3AF",
                boxShadow: "1px 1px 0px #000",
              }}
            />

            <span
              style={{
                fontSize: "24px",
                fontWeight: 900,
                color: "black",
                textShadow: "1px 1px 0px white",
              }}
            >
              {shouldShowLive ? "REC" : "OFF"}
            </span>
          </div>

          {/* Señal */}
          <div
            style={{
              position: "absolute",
              top: "22px",
              right: "28px",
              display: "flex",
              alignItems: "flex-end",
              gap: "5px",
              zIndex: 10,
            }}
          >
            <span style={signalBar(12, Boolean(shouldShowLive))} />
            <span style={signalBar(20, Boolean(shouldShowLive))} />
            <span style={signalBar(28, Boolean(shouldShowLive))} />
            <span style={signalBar(36, Boolean(shouldShowLive))} />
          </div>
        </div>

        <div
          style={{
            marginTop: "20px",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "30px",
              fontWeight: 900,
              lineHeight: 1,
              color: "black",
            }}
          >
            {shouldShowLive
              ? activeVideo?.title ?? "Vista del comedero"
              : "Comedero en descanso"}
          </h2>

          <p
            style={{
              marginTop: "8px",
              fontSize: "18px",
              fontWeight: 700,
              color: "#6B7280",
            }}
          >
            {shouldShowLive ? viewers : 0} viendo
          </p>
        </div>
      </div>
    </section>
  );
}

function randomViewers() {
  return randomBetween(35, 160);
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getNextVideoIndex(currentIndex: number, totalVideos: number) {
  if (totalVideos <= 1) return 0;

  let nextIndex = currentIndex;

  while (nextIndex === currentIndex) {
    nextIndex = randomBetween(0, totalVideos - 1);
  }

  return nextIndex;
}

function signalBar(height: number, isActive: boolean) {
  return {
    width: "8px",
    height: `${height}px`,
    borderRadius: "999px",
    backgroundColor: isActive ? "#39B54A" : "#9CA3AF",
    boxShadow: "1px 1px 0px #000",
    display: "block",
  };
}