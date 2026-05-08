import React, { useEffect, useState } from "react";

import CharityLogin from "./pages/Charity/CharityLogin";
import CharitySignup from "./pages/Charity/CharitySignup";
import CharityDashboard from "./pages/Charity/CharityDashboard";

export default function App() {
  const [page, setPage] = useState("charity-login");

  /* =========================================
     عند فتح التطبيق
     إذا الجمعية مسجلة مسبقًا تدخل مباشرة
  ========================================= */
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (token && role === "CHARITY") {
      setPage("charity-dashboard");
    } else {
      setPage("charity-login");
    }
  }, []);

  /* =========================================
     بعد نجاح تسجيل الدخول
  ========================================= */
  const handleLoginSuccess = () => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (token && role === "CHARITY") {
      setPage("charity-dashboard");
    } else if (token) {
      setPage("charity-dashboard");
    }
  };

  /* =========================================
     بعد إنشاء الحساب
  ========================================= */
  const handleSignupSuccess = () => {
    setPage("charity-login");
  };

  /* =========================================
     تسجيل خروج
  ========================================= */
  const logout = () => {
    localStorage.clear();
    setPage("charity-login");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* تسجيل دخول الجمعية */}
      {page === "charity-login" && (
        <CharityLogin
          onLoginSuccess={handleLoginSuccess}
          onGoToSignup={() => setPage("charity-signup")}
          onGoToLogin={() => setPage("charity-login")}
        />
      )}

      {/* إنشاء حساب جمعية */}
      {page === "charity-signup" && (
        <CharitySignup
          onSignupSuccess={handleSignupSuccess}
          onGoToLogin={() => setPage("charity-login")}
        />
      )}

      {/* الصفحة الرئيسية للجمعية */}
      {page === "charity-dashboard" && (
        <CharityDashboard onLogout={logout} />
      )}
    </div>
  );
}