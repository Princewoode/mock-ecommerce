"use client";

import { FormEvent, useEffect, useState } from "react";
import AdminProductManager from "@/components/AdminProductManager";
import AdminOrderManager from "@/components/AdminOrderManager";
import AdminReviewManager from "@/components/AdminReviewManager";
import AdminSellerManager from "@/components/AdminSellerManager";
const ADMIN_PASSWORD = "admin123";
const ADMIN_AUTH_KEY = "mockAdminLoggedIn";
const ADMIN_API_PASSWORD_KEY = "mockAdminApiPassword";

export default function ProtectedAdmin() {
  const [isChecking, setIsChecking] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    const savedLogin = localStorage.getItem(ADMIN_AUTH_KEY);

    if (savedLogin === "true") {
      setIsLoggedIn(true);
    }

    setIsChecking(false);
  }, []);

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password === ADMIN_PASSWORD) {
  localStorage.setItem(ADMIN_AUTH_KEY, "true");
  sessionStorage.setItem(ADMIN_API_PASSWORD_KEY, password);
  setIsLoggedIn(true);
  setPassword("");
  setLoginError("");
  return;
}

    setLoginError("Incorrect admin password.");
  }

  function handleLogout() {
  localStorage.removeItem(ADMIN_AUTH_KEY);
  sessionStorage.removeItem(ADMIN_API_PASSWORD_KEY);
  setIsLoggedIn(false);
  setPassword("");
  setLoginError("");
}

  if (isChecking) {
    return (
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-gray-600">Checking admin access...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="mt-8 max-w-md rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">Admin Login</h2>

        <p className="mt-2 text-gray-600">
          Enter the mock admin password to manage products.
        </p>

        <form onSubmit={handleLogin} className="mt-6 space-y-5">
          {loginError && (
            <div className="rounded-lg bg-red-50 p-4 text-red-700">
              {loginError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter admin password"
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
            />
          </div>

          <button
            type="submit"
            className="rounded-lg bg-black px-6 py-3 text-white"
          >
            Login
          </button>
        </form>

        <p className="mt-4 text-sm text-gray-500">
          Mock password: admin
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-gray-300 px-5 py-2 text-gray-900"
        >
          Logout Admin
        </button>
      </div>

      <AdminProductManager />
<AdminOrderManager />
<AdminReviewManager />
<AdminSellerManager />
    </>
  );
}