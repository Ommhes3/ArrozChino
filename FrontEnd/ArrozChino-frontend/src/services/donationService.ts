const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export type Donation = {
  donation_id: string;
  user_id: string | null;
  feeder_id: string;
  amount: number;
  food_amount: number;
  payment_status: string;
  payment_transaction_code: string | null;
  donation_date: string;
};

export type DonationStats = {
  donationsToday: number;
  myDonations: number;
};

export async function getDonations(): Promise<Donation[]> {
  const response = await fetch(`${API_URL}/donations`);

  if (!response.ok) {
    throw new Error("No se pudieron cargar las donaciones");
  }

  const data = await response.json();

  return data.donations ?? [];
}

export async function requestDonation(params: {
  userId: string | null;
  feederId: string;
  amount: number;
}) {
  const response = await fetch(`${API_URL}/donations/request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: params.userId,
      feeder_id: params.feederId,
      amount: params.amount,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.detail ?? "No se pudo registrar la donación");
  }

  return response.json();
}

export function calculateDonationStats(
  donations: Donation[],
  userId: string | null
): DonationStats {
  const today = new Date().toISOString().slice(0, 10);

  const donationsToday = donations.filter((donation) => {
    if (!donation.donation_date) return false;

    const donationDay = new Date(donation.donation_date)
      .toISOString()
      .slice(0, 10);

    return donationDay === today;
  }).length;

  const myDonations = donations.filter((donation) => {
    return donation.user_id === userId;
  }).length;

  return {
    donationsToday,
    myDonations,
  };
}