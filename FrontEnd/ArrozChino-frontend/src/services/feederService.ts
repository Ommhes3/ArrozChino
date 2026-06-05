const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export type Feeder = {
  feeder_id: string;
  name: string;
  location?: string;
  food_limit?: number;
  price_per_donation?: number;
  portion_per_donation?: number;
  stream_url?: string;
  is_active?: boolean;
  food_level?: number;
  created_at?: string;
};

export type CreateFeederParams = {
  feeder_id: string;
  name: string;
  location?: string;
  food_limit?: number;
  price_per_donation?: number;
  portion_per_donation?: number;
  stream_url?: string;
};

export async function createFeeder(params: CreateFeederParams) {
  const response = await fetch(`${API_URL}/feeders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      feeder_id: params.feeder_id,
      name: params.name,
      location: params.location ?? "",
      food_limit: Number(params.food_limit ?? 10),
      price_per_donation: Number(params.price_per_donation ?? 10000),
      portion_per_donation: Number(params.portion_per_donation ?? 0.25),
      stream_url: params.stream_url ?? "http://esp32cam.local/stream",
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.detail ?? "No se pudo crear el comedero");
  }

  return response.json();
}

export async function getFeeders(): Promise<Feeder[]> {
  const response = await fetch(`${API_URL}/feeders`);

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.detail ?? "No se pudieron consultar los comederos");
  }

  const data = await response.json();

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data.feeders)) {
    return data.feeders;
  }

  return [];
}