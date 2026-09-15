import { useEffect, useState } from "react";
import AuthPage from "./AuthPage";
import DashboardLayout from "./DashboardLayout";
import { authApi, authStorage } from "./api";

function SplashScreen() {
  return (
    <main className="grid min-h-[100dvh] place-items-center overflow-hidden bg-[#111e2f] px-6 text-center text-white">
      <div className="splash-content">
        <img
          src="/assets/gasflow-logo-primary.png"
          alt="GasFlow"
          className="splash-mark mx-auto h-24 w-24 rounded-[28px] shadow-[0_18px_36px_rgba(21,146,93,.30)]"
        />
        <h1 className="mt-6 text-4xl font-extrabold tracking-[-.07em]">
          GasFlow <span className="text-[#36ca8b]">•</span>
        </h1>
        <p className="mt-2 text-[12px] font-medium text-[#b7c5d2]">
          Your depot, in flow.
        </p>
        <div className="mt-8 h-1.5 w-36 overflow-hidden rounded-full bg-white/[.12]" aria-hidden="true">
          <span className="splash-progress block h-full rounded-full bg-[#36ca8b]" />
        </div>
        <p role="status" className="mt-3 text-[10px] font-bold tracking-[.12em] text-[#9fb0bd]">
          LOADING WORKSPACE
        </p>
      </div>
    </main>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [showSplash, setShowSplash] = useState(true);
  const resetToken = new URLSearchParams(window.location.search).get("reset_token") || "";

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSplash(false), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!authStorage.getToken()) return;
    authApi.me()
      .then(({ user: currentUser }) => {
        authStorage.save({ token: authStorage.getToken(), user: currentUser });
        setUser(currentUser);
        setIsAuthenticated(true);
      })
      .catch(() => authStorage.clear());
  }, []);

  const handleAuthSuccess = ({ token, user: signedInUser }) => {
    authStorage.save({ token, user: signedInUser });
    setUser(signedInUser);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    authStorage.clear();
    setUser(null);
    setIsAuthenticated(false);
  };

  const handleProfileUpdated = (updatedUser) => {
    setUser(updatedUser);
    authStorage.save({ token: authStorage.getToken(), user: updatedUser });
  };

  if (showSplash) return <SplashScreen />;

  if (isAuthenticated) {
    return <DashboardLayout user={user} onLogout={handleLogout} onProfileUpdated={handleProfileUpdated} />;
  }

  return <AuthPage initialMode={resetToken ? "reset" : "login"} resetToken={resetToken} onSuccess={handleAuthSuccess} />;
}

export default App;
