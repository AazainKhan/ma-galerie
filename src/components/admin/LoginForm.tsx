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
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md border border-gray-100">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
        <p className="text-sm text-gray-500 mt-2">
          Sign in to manage your gallery
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-100">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="password-input" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password-input"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
        </button>
      </form>
    </div>
  );
}
