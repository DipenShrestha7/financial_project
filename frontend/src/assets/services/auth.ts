import axios from "axios";
import Cookies from "js-cookie";

export type UserSession = {
  token: string;
  user: {
    name: string;
    email: string;
    role: string;
  };
};

const SESSION_COOKIE_NAME = "hisabkitab_session";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

export function setSessionCookie(session: UserSession) {
  Cookies.set(SESSION_COOKIE_NAME, JSON.stringify(session), {
    expires: 7,
    sameSite: "Lax",
    secure: window.location.protocol === "https:",
  });
}

export function getSessionCookie(): UserSession | null {
  const rawSession = Cookies.get(SESSION_COOKIE_NAME);

  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession) as UserSession;
  } catch {
    return null;
  }
}

export function clearSessionCookie() {
  Cookies.remove(SESSION_COOKIE_NAME);
}

export async function signupWithEmail(
  name: string,
  email: string,
  password: string,
) {
  const response = await api.post("/auth/signup", {
    name,
    email,
    password,
  });

  const session: UserSession = {
    token: response.data.token,
    user: {
      name: response.data.user.name,
      email: response.data.user.email,
      role: response.data.user.role,
    },
  };

  setSessionCookie(session);
  return session;
}

export async function loginWithEmail(email: string, password: string) {
  const response = await api.post("/auth/login", {
    email,
    password,
  });

  const session: UserSession = {
    token: response.data.token,
    user: {
      name: response.data.user.name,
      email: response.data.user.email,
      role: response.data.user.role,
    },
  };

  setSessionCookie(session);
  return session;
}

export async function logout() {
  clearSessionCookie();
  return true;
}
