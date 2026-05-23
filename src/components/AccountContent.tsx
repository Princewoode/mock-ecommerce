"use client";

import { FormEvent, useEffect, useState } from "react";
import { CustomerUser } from "@/types/models";
import { getCurrentCustomer } from "@/utils/authStorage";
import {
  loginCustomerWithSupabase,
  logoutCustomerFromSupabase,
  registerCustomerWithSupabase,
  updateCustomerProfileInSupabase,
} from "@/utils/supabaseAuthService";

export default function AccountContent() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [currentUser, setCurrentUser] = useState<CustomerUser | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const [editFullName, setEditFullName] = useState("");
  const [editShippingAddress, setEditShippingAddress] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setCurrentUser(getCurrentCustomer());
  }, []);

  function resetForm() {
    setFullName("");
    setEmail("");
    setShippingAddress("");
    setPassword("");
    setMessage("");
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !fullName.trim() ||
      !email.trim() ||
      !shippingAddress.trim() ||
      !password.trim()
    ) {
      setMessage("Please fill in all fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage("");

      const customer = await registerCustomerWithSupabase({
        fullName,
        email,
        password,
        shippingAddress,
      });

      setCurrentUser(customer);
      resetForm();
      window.dispatchEvent(new Event("customerUpdated"));
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Registration failed."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setMessage("Please enter your email and password.");
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage("");

      const customer = await loginCustomerWithSupabase({
        email,
        password,
      });

      setCurrentUser(customer);
      resetForm();
      window.dispatchEvent(new Event("customerUpdated"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogout() {
    await logoutCustomerFromSupabase();
    setCurrentUser(null);
    setIsEditing(false);
    resetForm();
    window.dispatchEvent(new Event("customerUpdated"));
  }

  function startEditing() {
    if (!currentUser) {
      return;
    }

    setEditFullName(currentUser.fullName);
    setEditShippingAddress(currentUser.shippingAddress);
    setNewPassword("");
    setEditMessage("");
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setIsEditing(false);
    setEditMessage("");
    setNewPassword("");
  }

  async function handleUpdateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editFullName.trim() || !editShippingAddress.trim()) {
      setEditMessage("Please fill in your name and shipping address.");
      return;
    }

    try {
      setIsSubmitting(true);
      setEditMessage("");

      const updatedCustomer = await updateCustomerProfileInSupabase({
        fullName: editFullName,
        shippingAddress: editShippingAddress,
        newPassword,
      });

      setCurrentUser(updatedCustomer);
      setIsEditing(false);
      setNewPassword("");
      window.dispatchEvent(new Event("customerUpdated"));
    } catch (error) {
      setEditMessage(
        error instanceof Error ? error.message : "Profile update failed."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (currentUser) {
    return (
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">My Account</h2>

        {!isEditing ? (
          <>
            <div className="mt-6 space-y-3 text-gray-700">
              <p>
                <span className="font-semibold text-gray-900">Name:</span>{" "}
                {currentUser.fullName}
              </p>

              <p>
                <span className="font-semibold text-gray-900">Email:</span>{" "}
                {currentUser.email}
              </p>

              <p>
                <span className="font-semibold text-gray-900">
                  Shipping Address:
                </span>{" "}
                {currentUser.shippingAddress}
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={startEditing}
                className="rounded-lg bg-black px-6 py-3 text-white"
              >
                Edit Profile
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-gray-300 px-6 py-3 text-gray-900"
              >
                Logout
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleUpdateProfile} className="mt-6 space-y-5">
            {editMessage && (
              <div className="rounded-lg bg-red-50 p-4 text-red-700">
                {editMessage}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Full Name
              </label>

              <input
                type="text"
                value={editFullName}
                onChange={(event) => setEditFullName(event.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email Address
              </label>

              <input
                type="email"
                value={currentUser.email}
                disabled
                className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-100 px-4 py-3 text-gray-500"
              />

              <p className="mt-2 text-sm text-gray-500">
                Email change is disabled in this phase. We will add verified
                email changes later.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Shipping Address
              </label>

              <textarea
                value={editShippingAddress}
                onChange={(event) =>
                  setEditShippingAddress(event.target.value)
                }
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                New Password
              </label>

              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Leave blank to keep current password"
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-black px-6 py-3 text-white disabled:bg-gray-400"
              >
                {isSubmitting ? "Saving..." : "Save Profile"}
              </button>

              <button
                type="button"
                onClick={handleCancelEdit}
                className="rounded-lg border border-gray-300 px-6 py-3 text-gray-900"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="mt-8 max-w-xl rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => {
            setMode("login");
            resetForm();
          }}
          className={`rounded-lg px-5 py-2 ${
            mode === "login"
              ? "bg-black text-white"
              : "border border-gray-300 text-gray-900"
          }`}
        >
          Login
        </button>

        <button
          type="button"
          onClick={() => {
            setMode("register");
            resetForm();
          }}
          className={`rounded-lg px-5 py-2 ${
            mode === "register"
              ? "bg-black text-white"
              : "border border-gray-300 text-gray-900"
          }`}
        >
          Register
        </button>
      </div>

      <h2 className="mt-6 text-2xl font-bold text-gray-900">
        {mode === "login"
          ? "Customer Login"
          : "Create Customer Account"}
      </h2>

      {message && (
        <div className="mt-5 rounded-lg bg-red-50 p-4 text-red-700">
          {message}
        </div>
      )}

      <form
        onSubmit={mode === "login" ? handleLogin : handleRegister}
        className="mt-6 space-y-5"
      >
        {mode === "register" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Full Name
              </label>

              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Shipping Address
              </label>

              <textarea
                value={shippingAddress}
                onChange={(event) => setShippingAddress(event.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                placeholder="Enter your shipping address"
                rows={4}
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email Address
          </label>

          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
            placeholder="Enter your password"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-black px-6 py-3 text-white disabled:bg-gray-400"
        >
          {isSubmitting
            ? "Please wait..."
            : mode === "login"
              ? "Login"
              : "Create Account"}
        </button>
      </form>
    </div>
  );
}