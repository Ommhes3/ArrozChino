import { useState } from "react";
import Header from "../components/layout/Header";
import Navbar from "../components/layout/Navbar";
import LiveStreamCard from "../components/home/LiveStreamCard";
import DonationPanel from "../components/home/DonationPanel";

export default function Home() {
  const [isLive, setIsLive] = useState(true);

  const [donationsToday, setDonationsToday] = useState(24);
  const [myDonations, setMyDonations] = useState(156);
  const [rescuedCats] = useState(8);

  const liveVideos = [
    {
      src: "/stream.mp4",
      title: "Vista del comedero",
    },
    {
      src: "/stream1.mp4",
      title: "Zona de gatitos",
    },
    {
      src: "/stream2.mp4",
      title: "Patio de descanso",
    },
  ];

  function handleDonationSuccess() {
    setDonationsToday((current) => current + 1);
    setMyDonations((current) => current + 1);
  }

return (
  <main
    style={{
      minHeight: "100vh",
      backgroundColor: "#FFFFFF",
      paddingBottom: "140px",
    }}
  >
    <Header isLive={isLive} />

    <LiveStreamCard
      videos={liveVideos}
      sleepingImageSrc="/logoDormido.png"
      onLiveStatusChange={setIsLive}
    />

    <DonationPanel
      donationsToday={donationsToday}
      myDonations={myDonations}
      rescuedCats={rescuedCats}
      onDonationSuccess={handleDonationSuccess}
    />

    <Navbar active="Inicio" />
  </main>
);
}