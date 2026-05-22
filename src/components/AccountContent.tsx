"use client";
import { updateOrdersForCustomerEmail } from "@/utils/orderStorage";
import { FormEvent, useEffect, useState } from "react";
import {
  CustomerUser,
  getCurrentCustomer,
  getCustomers,
  logoutCustomer,
  saveCustomers,
  setCurrentCustomer,
} from "@/utils/authStorage";

type OrderItem = {
  productId: number;
  name: string;
  category: string;
  image: string;
  price: number;
  quantity: number;
};

type Order = {
  id: string;
  createdAt: string;
  status: string;
  paymentMethod?: string;
  customer: {
    fullName: string;
    email: string;
    shippingAddress: string;
  };
  items: OrderItem[];
  total: number;
};

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
  const [editEmail, setEditEmail] = useState("");
  const [editShippingAddress, setEditShippingAddress] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editMessage, setEditMessage] = useState("");

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

  function handleRegister(event: FormEvent<HTMLFormElement>) {
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

    const users = getCustomers();
    const existingUser = users.find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      setMessage("An account with this email already exists.");
      return;
    }

    const newUser: CustomerUser = {
      id: `CU-${Date.now()}`,
      fullName,
      email,
      shippingAddress,
      password,
    };

    saveCustomers([newUser, ...users]);
    setCurrentCustomer(newUser);
    setCurrentUser(newUser);
    resetForm();
  }

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setMessage("Please enter your email and password.");
      return;
    }

    const users = getCustomers();
    const foundUser = users.find(
      (user) =>
        user.email.toLowerCase() === email.toLowerCase() &&
        user.password === password
    );

    if (!foundUser) {
      setMessage("Invalid email or password.");
      return;
    }

    setCurrentCustomer(foundUser);
    setCurrentUser(foundUser);
    resetForm();
  }

  function handleLogout() {
    logoutCustomer();
    setCurrentUser(null);
    setIsEditing(false);
    resetForm();
  }

  function startEditing() {
    if (!currentUser) {
      return;
    }

    setEditFullName(currentUser.fullName);
    setEditEmail(currentUser.email);
    setEditShippingAddress(currentUser.shippingAddress);
    setEditPassword(currentUser.password);
    setEditMessage("");
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setIsEditing(false);
    setEditMessage("");
  }


  function handleUpdateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentUser) {
      return;
    }

    if (
      !editFullName.trim() ||
      !editEmail.trim() ||
      !editShippingAddress.trim() ||
      !editPassword.trim()
    ) {
      setEditMessage("Please fill in all profile fields.");
      return;
    }

    const users = getCustomers();

    const emailBelongsToAnotherUser = users.some(
      (user) =>
        user.id !== currentUser.id &&
        user.email.toLowerCase() === editEmail.toLowerCase()
    );

    if (emailBelongsToAnotherUser) {
      setEditMessage("Another customer already uses this email.");
      return;
    }

    const oldEmail = currentUser.email;

    const updatedUser: CustomerUser = {
      ...currentUser,
      fullName: editFullName,
      email: editEmail,
      shippingAddress: editShippingAddress,
      password: editPassword,
    };

    const updatedUsers = users.map((user) =>
      user.id === currentUser.id ? updatedUser : user
    );

    saveCustomers(updatedUsers);
    setCurrentCustomer(updatedUser);
    updateOrdersForCustomerEmail(oldEmail, updatedUser);

    setCurrentUser(updatedUser);
    setIsEditing(false);
    setEditMessage("");
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
                value={editEmail}
                onChange={(event) => setEditEmail(event.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
              />
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
                Password
              </label>

              <input
                type="password"
                value={editPassword}
                onChange={(event) => setEditPassword(event.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                className="rounded-lg bg-black px-6 py-3 text-white"
              >
                Save Profile
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
        {mode === "login" ? "Customer Login" : "Create Customer Account"}
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
          className="rounded-lg bg-black px-6 py-3 text-white"
        >
          {mode === "login" ? "Login" : "Create Account"}
        </button>
      </form>
    </div>
  );
}