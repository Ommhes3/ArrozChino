import { useEffect, useState } from "react";
import Header from "../components/layout/Header";
import Navbar from "../components/layout/Navbar";
import LiveStreamCard from "../components/home/LiveStreamCard";
import DonationPanel from "../components/home/DonationPanel";
import { getCurrentUser } from "../services/userService";
import {
  calculateDonationStats,
  getDonations,
  requestDonation,
} from "../services/donationService";

const FEEDER_ID = "feeder-demo";

export default function Home() {
  const [isLive, setIsLive] = useState(true);
  const [donationsToday, setDonationsToday] = useState(0);
  const [myDonations, setMyDonations] = useState(0);
  const [rescuedCats] = useState(8);

  const currentUser = getCurrentUser();

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

  async function loadDonationStats() {
    const donations = await getDonations();

    const stats = calculateDonationStats(
      donations,
      currentUser?.user_id ?? null
    );

    setDonationsToday(stats.donationsToday);
    setMyDonations(stats.myDonations);
  }

  useEffect(() => {
    loadDonationStats().catch((error) => {
      console.error("Error cargando donaciones:", error);
    });
  }, []);

  async function handleDonationSuccess() {
    if (!currentUser) {
      alert("Primero debes iniciar sesión o registrarte para donar.");
      window.location.href = "/login";
      return;
    }

    await requestDonation({
      userId: currentUser.user_id,
      feederId: FEEDER_ID,
      amount: 5000,
    });

    await loadDonationStats();
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