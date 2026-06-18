import { Loader2 } from "lucide-react";
import { useState } from "react";

export default function LoginForm() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        window.location.href = "/admin";
      } else {
        setError("Invalid password");
      }
    } catch (_err) {
      setError("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="admin-card w-full max-w-md p-8 space-y-6 rounded-xl shadow-lg border admin-border"
      style={{ backgroundColor: "var(--bg-app)", color: "var(--text)" }}
    >
      <div className="text-center">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
          Admin Login
        </h1>
        <p className="text-sm admin-text-muted mt-2">
          Sign in to manage your gallery
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        {error && (
          <div
            className="p-3 text-sm rounded-md"
            style={{
              background: "color-mix(in oklab, #ef4444 15%, transparent)",
              color: "#ef4444",
              border: "1px solid color-mix(in oklab, #ef4444 30%, transparent)",
            }}
          >
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="password-input"
            className="block text-sm font-medium admin-text-muted mb-1"
          >
            Password
          </label>
          <input
            id="password-input"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="admin-input w-full px-3 py-2 rounded-md"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="admin-button w-full flex justify-center items-center"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
        </button>
      </form>
    </div>
  );
}
