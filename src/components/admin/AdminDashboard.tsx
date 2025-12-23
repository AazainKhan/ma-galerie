import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import AlbumManager from "./AlbumManager";

export default function AdminDashboard() {
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Simple check if cookie exists
    if (!document.cookie.includes("admin_session=true")) {
      window.location.href = "/admin/login";
    } else {
      setAuthorized(true);
    }
  }, []);

  const handleLogout = () => {
    document.cookie =
      "admin_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    window.location.href = "/admin/login";
  };

  if (!authorized) return null;

  // Use CSS variables from the site's theme instead of Tailwind dark: classes
  // This ensures the admin panel matches the site's theme automatically
  return (
    <div
      className="admin-panel min-h-screen"
      style={{ backgroundColor: "var(--bg-app)", color: "var(--text)" }}
    >
      <Toaster position="top-right" />

      {/* Header */}
      <header className="admin-header sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="font-bold text-xl tracking-tight"
              style={{ color: "var(--text)" }}
            >
              Admin
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-full transition-colors admin-button-ghost"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Content */}
        <div className="admin-card rounded-xl shadow-sm p-6 min-h-[600px]">
          <AlbumManager />
        </div>
      </main>
    </div>
  );
}
