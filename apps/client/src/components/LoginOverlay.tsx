import React, { useState } from "react";
import axios from "axios";

export default function LoginOverlay({
  onLogin,
}: {
  onLogin: (user: any) => void;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("READY");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("AUTHENTICATING");

    const baseURL = import.meta.env.PROD
      ? "https://plinth.fly.dev"
      : "http://localhost:5001";

    try {
      const { data } = await axios.post(`${baseURL}/api/users/login`, {
        email: email.toLowerCase().trim(),
      });

      console.log("🔑 Auth Success. Payload:", data);

      if (!data.flyMachineId) {
        console.warn("⚠️ Warning: flyMachineId missing from server response!");
      }

      setStatus("CONNECTED");

      setTimeout(() => {
        onLogin(data);
      }, 800);
    } catch (err: any) {
      console.error("❌ Login Failed:", err.response?.data || err.message);
      setStatus("ERROR");
      setLoading(false);
      setTimeout(() => setStatus("READY"), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0a0a0a] font-sans selection:bg-white/10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/[0.03] via-transparent to-transparent pointer-events-none" />

      <div className="relative w-[360px]">
        <div className="relative p-10 bg-[#111111]/80 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-2xl">
          <header className="mb-12 text-center">
            <h2 className="text-white text-[13px] font-medium uppercase tracking-[0.4em] opacity-90">
              PLINTH
            </h2>
            <p className="text-[10px] text-gray-500 mt-2 font-light tracking-widest uppercase">
              Spatial Code Editor
            </p>
          </header>

          <form onSubmit={handleAuth} className="space-y-8">
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] text-gray-400 uppercase tracking-widest">
                  EMAIL
                </label>
                <span
                  className={`text-[9px] font-mono transition-colors duration-300 ${
                    status === "ERROR" ? "text-red-400" : "text-gray-600"
                  }`}
                >
                  {status}
                </span>
              </div>

              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/5 p-4 text-[13px] text-white outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all rounded-2xl placeholder:text-gray-700"
                placeholder="email@example.com"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-white text-black text-[11px] font-semibold uppercase tracking-[0.2em] rounded-2xl transition-all hover:bg-gray-200 active:scale-[0.98] disabled:opacity-30 flex items-center justify-center gap-2"
            >
              {loading && (
                <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              )}
              <span>{loading ? "Verify" : "Enter"}</span>
            </button>
          </form>

          <footer className="mt-12 text-center">
            <div className="h-[1px] w-8 bg-white/10 mx-auto mb-6" />
            <p className="text-[9px] text-gray-600 uppercase tracking-[0.3em] font-light">
              Secure terminal access
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
