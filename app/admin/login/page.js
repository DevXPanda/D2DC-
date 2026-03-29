"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { getSession, setSession } from "@/lib/session-store";

export default function AdminLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [setupForm, setSetupForm] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const adminExists = useQuery(api.auth.hasAdminAccount);
  const createAdminAccount = useMutation(api.auth.createAdminAccount);
  const login = useMutation(api.auth.login);

  useEffect(() => {
    const session = getSession();
    if (session) {
      router.replace(
        session.role === "collector"
          ? "/collector/dashboard"
          : session.role === "supervisor"
            ? "/supervisor/dashboard"
            : session.role === "citizen"
              ? "/citizen/dashboard"
            : "/dashboard"
      );
      return;
    }
  }, [router]);

  if (adminExists === undefined) {
    return null;
  }

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const user = await login({
        identifier: formData.identifier,
        password: formData.password
      });
      setSession(user);
      router.replace(
        user.role === "collector"
          ? "/collector/dashboard"
          : user.role === "supervisor"
            ? "/supervisor/dashboard"
            : user.role === "citizen"
              ? "/citizen/dashboard"
              : "/dashboard"
      );
    } catch (loginError) {
      setError(loginError.message || "Invalid login credentials");
      setLoading(false);
    }
  };

  const handleSetup = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const admin = await createAdminAccount(setupForm);
      setSession(admin);
      router.replace("/dashboard");
    } catch (setupError) {
      setError(setupError.message || "Unable to create admin account");
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-bg min-h-screen flex items-center justify-center px-4 relative">
      <div className="absolute inset-0 bg-black opacity-45 z-0" />
      <div className="max-w-md w-full relative z-10">
        <div className="card max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-primary-100 p-3 rounded-full">
                <Shield className="w-8 h-8 text-primary-600" />
              </div>
            </div>
            <h1 className="ds-page-title text-primary-600 mb-2">D2DC Portal</h1>
            <p className="text-gray-600">D2DC - Door-to-Door Collection System</p>
            <p className="text-sm text-gray-500 mt-2">{adminExists ? "Single login for admin, supervisor, collector, and citizen" : "Create the first admin account"}</p>
          </div>

          {adminExists ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="label">Email, Username or Phone</label>
                <input
                  type="text"
                  className="input"
                  value={formData.identifier}
                  onChange={(event) => setFormData((prev) => ({ ...prev, identifier: event.target.value }))}
                  placeholder="Enter email / username / phone"
                  required
                />
              </div>

              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  className="input"
                  value={formData.password}
                  onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
                  placeholder="Enter your password"
                  required
                />
              </div>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <button type="submit" disabled={loading} className="btn btn-primary w-full bg-blue-600 hover:bg-blue-700">
                {loading ? "Logging in..." : "Login to D2DC Portal"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSetup} className="space-y-6">
              <div>
                <label className="label">Admin Name</label>
                <input className="input" value={setupForm.name} onChange={(event) => setSetupForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Enter full name" required />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Username</label>
                  <input className="input" value={setupForm.username} onChange={(event) => setSetupForm((prev) => ({ ...prev, username: event.target.value }))} placeholder="admin username" required />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input" value={setupForm.phone} onChange={(event) => setSetupForm((prev) => ({ ...prev, phone: event.target.value }))} placeholder="Admin phone" required />
                </div>
              </div>

              <div>
                <label className="label">Email</label>
                <input className="input" type="email" value={setupForm.email} onChange={(event) => setSetupForm((prev) => ({ ...prev, email: event.target.value }))} placeholder="admin@example.com" required />
              </div>

              <div>
                <label className="label">Password</label>
                <input className="input" type="password" value={setupForm.password} onChange={(event) => setSetupForm((prev) => ({ ...prev, password: event.target.value }))} placeholder="Create admin password" required />
              </div>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <button type="submit" disabled={loading} className="btn btn-primary w-full bg-blue-600 hover:bg-blue-700">
                {loading ? "Creating Account..." : "Create Admin Account"}
              </button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t text-sm text-gray-600">
            {adminExists ? "Use your role account to access the correct dashboard automatically." : "This setup creates the only admin account from this auth screen."}
            <div className="mt-4">
              Need help?
              <Link href="/" className="ml-1 font-medium text-primary-600 hover:underline">
                Return Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
