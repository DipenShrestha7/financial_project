import { Eye, EyeOff, X } from "lucide-react";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router";
import { loginWithEmail, signupWithEmail } from "../services/auth";

type LoginModalProps = {
  isOpen: boolean;
  initialMode?: "login" | "signup";
  onClose: () => void;
};

export default function LoginModal({
  isOpen,
  initialMode = "login",
  onClose,
}: LoginModalProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "signup") {
        if (!name.trim()) {
          setError("Please enter your full name.");
          setLoading(false);
          return;
        }

        await signupWithEmail(name.trim(), email.trim(), password);
      } else {
        await loginWithEmail(email.trim(), password);
      }

      navigate("/dashboard");
      onClose();
    } catch (err) {
      const message = axios.isAxiosError<{ message?: string }>(err)
        ? (err.response?.data?.message ??
          "Unable to connect to the server. Please try again.")
        : err instanceof Error
          ? err.message
          : "Unable to continue with authentication.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#020505]/80 px-3 py-4 backdrop-blur-sm sm:px-4">
      <div className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-[#182224] bg-[#0a0f10] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.6)] sm:p-6">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">
              {mode === "login" ? "Welcome back" : "Create account"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[#92a6a7] transition hover:bg-[#111819] hover:text-white"
            aria-label="Close login dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-4 flex rounded-xl border border-[#1d2a2b] bg-[#0d1516] p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
              mode === "login"
                ? "bg-[#32c7aa] text-[#02160f]"
                : "text-[#a9b7b7]"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
              mode === "signup"
                ? "bg-[#32c7aa] text-[#02160f]"
                : "text-[#a9b7b7]"
            }`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label
                htmlFor="name"
                className="mb-1.5 block text-[11px] text-[#aab7b7]"
              >
                Full name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-xl border border-[#1d2a2b] bg-[#0d1516] px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-[#3ad3b4]"
                placeholder="Your name"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-[11px] text-[#aab7b7]"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-[#1d2a2b] bg-[#0d1516] px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-[#3ad3b4]"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-[11px] text-[#aab7b7]"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-[#1d2a2b] bg-[#0d1516] px-3.5 py-2.5 pr-11 text-sm text-white outline-none transition focus:border-[#3ad3b4]"
                placeholder="Enter your password"
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute inset-y-0 right-3 flex items-center text-[#8ea09f]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-[#552d2d] bg-[#1a1216] px-3 py-2 text-[12px] text-[#f6a4a4]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#32c7aa] px-4 py-3 text-sm font-semibold text-[#02160f] transition hover:bg-[#4dd7bb] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading
              ? mode === "login"
                ? "Signing in..."
                : "Creating account..."
              : mode === "login"
                ? "Login to dashboard"
                : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
