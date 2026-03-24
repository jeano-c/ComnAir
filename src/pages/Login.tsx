import { useState } from "react";
import { Navigate } from "react-router";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const { login, isLoggingIn, isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      await login({ email, password });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to login. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-gray-200"></div>
            <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-[#1F8F22] border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-700 font-medium">Checking session...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex h-screen w-full font-sans">
      <div
        className="hidden md:flex md:w-1/2 flex-col items-center justify-center relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "url('/imgs/image 1.png')" }}
      >
        <div className="absolute inset-0 bg-white/30" />

        <div className="absolute bottom-0 w-full h-1/3 bg-linear-to-t from-white to-transparent" />

        <div className="relative z-10 flex flex-col items-center px-10 text-center mt-[-10%]">
          <div className="w-24 h-24 rounded-2xl bg-[#32C85A] shadow-md flex items-center justify-center mb-6">
            <img src="/imgs/logo.png" alt="Logo" className="h-14 object-contain" />
          </div>

          <h1 className="text-[32px] font-extrabold text-black mb-2">
            Login for Admin
          </h1>
          <p className="text-gray-700 text-sm font-medium">
            Monitoring the common ground.
          </p>
        </div>
      </div>
      <div className="flex w-full md:w-1/2 items-center justify-center bg-white px-6">
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Login</h2>
            <p className="text-sm text-gray-500 mt-1">
              Login to access your ComnAir Admin account
            </p>
          </div>

          <div>
            {errorMsg && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                {errorMsg}
              </div>
            )}
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email / Username
            </label>
            <input
              type="text"
              placeholder="admin@comnair.com"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#1F8F22] focus:ring-1 focus:ring-[#1F8F22] transition"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm outline-none focus:border-[#1F8F22] focus:ring-1 focus:ring-[#1F8F22] transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember me / Forgot password */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={() => setRemember(!remember)}
                className="h-4 w-4 rounded border-gray-300 accent-[#1F8F22]"
              />
              <span className="text-gray-600">Remember me</span>
            </label>
            <a href="#" className="text-[#1F8F22] hover:underline font-medium">
              Forgot Password?
            </a>
          </div>

          {/* Login button */}
          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full rounded-lg bg-[#1F8F22] py-2.5 text-sm font-semibold text-white hover:bg-[#1a7a1d] active:bg-[#166918] transition cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoggingIn ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>

          {/* Contact */}
          <p className="text-center text-sm text-gray-500">
            Don't have an account?{" "}
            <a
              href="#"
              className="text-[#1F8F22] font-semibold hover:underline"
            >
              Contact Developer
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
