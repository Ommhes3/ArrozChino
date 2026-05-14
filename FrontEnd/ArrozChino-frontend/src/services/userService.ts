const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export type UserRole = "donor" | "admin";

export type User = {
  user_id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at?: string;
};

type LoginResponse = {
  success: boolean;
  message: string;
  user: User;
};

type RegisterResponse = {
  success: boolean;
  message?: string;
  user: User;
};

export async function loginUser(params: {
  email: string;
  password: string;
}): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/users/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      password: params.password,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.detail ?? "No se pudo iniciar sesión");
  }

  return response.json();
}

export async function registerUser(params: {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}): Promise<RegisterResponse> {
  const response = await fetch(`${API_URL}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: params.name,
      email: params.email,
      password: params.password,
      role: params.role ?? "donor",
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.detail ?? "No se pudo registrar el usuario");
  }

  return response.json();
}

export function saveSession(user: User) {
  localStorage.setItem("user_id", user.user_id);
  localStorage.setItem("user_name", user.name);
  localStorage.setItem("user_email", user.email);
  localStorage.setItem("user_role", user.role);
}

export function getCurrentUser(): User | null {
  const userId = localStorage.getItem("user_id");
  const name = localStorage.getItem("user_name");
  const email = localStorage.getItem("user_email");
  const role = localStorage.getItem("user_role") as UserRole | null;

  if (!userId || !name || !email || !role) return null;

  return {
    user_id: userId,
    name,
    email,
    role,
  };
}

export function logoutUser() {
  localStorage.removeItem("user_id");
  localStorage.removeItem("user_name");
  localStorage.removeItem("user_email");
  localStorage.removeItem("user_role");
}