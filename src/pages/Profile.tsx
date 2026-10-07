import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { IoPersonOutline, IoKeyOutline, IoShieldCheckmarkOutline } from "react-icons/io5";

export default function Profile() {
  const { user, updateProfile, isUpdatingProfile, changePassword, isChangingPassword } = useAuth();

  // Display Name state
  const [displayName, setDisplayName] = useState("");
  const [nameSuccess, setNameSuccess] = useState("");
  const [nameError, setNameError] = useState("");

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passSuccess, setPassSuccess] = useState("");
  const [passError, setPassError] = useState("");

  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (user?.name) {
      setDisplayName(user.name);
    } else {
      const stored = localStorage.getItem("admin_name");
      if (stored) setDisplayName(stored);
    }
  }, [user]);

  // Initials generator: first two letters
  const getInitials = (name?: string): string => {
    if (!name || !name.trim()) return "AD";
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.trim().slice(0, 2).toUpperCase();
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameSuccess("");
    setNameError("");

    if (!displayName.trim()) {
      setNameError("Display name cannot be empty.");
      return;
    }

    try {
      localStorage.setItem("admin_name", displayName.trim());
      await updateProfile({ name: displayName.trim() });
      setNameSuccess("Display name updated successfully.");
    } catch (err: any) {
      // In case backend is offline, still persist locally for UI consistency
      localStorage.setItem("admin_name", displayName.trim());
      setNameSuccess("Display name updated.");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassSuccess("");
    setPassError("");

    if (!currentPassword) {
      setPassError("Current password is required.");
      return;
    }

    if (newPassword.length < 6) {
      setPassError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError("New passwords do not match.");
      return;
    }

    try {
      await changePassword({ currentPassword, newPassword });
      setPassSuccess("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPassError(err.message || "Failed to change password. Please check your current password.");
    }
  };

  const adminName = displayName || user?.name || "Admin User";
  const adminEmail = user?.email || "admin@comnair.com";

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 sm:p-10 font-sans flex flex-col">
      <div className="max-w-3xl w-full mx-auto space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Manage Profile
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-normal">
            Manage your administrator credentials, display name, and password settings.
          </p>
        </div>

        {/* Profile Card Overview */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="shrink-0">
            {user?.avatarUrl && !imgError ? (
              <img
                src={user.avatarUrl}
                alt={adminName}
                onError={() => setImgError(true)}
                className="w-20 h-20 rounded-full object-cover ring-4 ring-gray-100"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-emerald-600 text-white text-2xl font-bold flex items-center justify-center select-none ring-4 ring-emerald-100">
                {getInitials(adminName)}
              </div>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <h2 className="text-xl font-bold text-gray-900">{adminName}</h2>
            <p className="text-sm text-gray-500 font-medium">{adminEmail}</p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <IoShieldCheckmarkOutline className="text-sm" />
                Administrator
              </span>
            </div>
          </div>
        </div>

        {/* Form 1: Change Display Name */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-700 flex items-center justify-center border border-gray-200">
              <IoPersonOutline className="text-xl" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Change Display Name</h2>
              <p className="text-xs text-gray-500">Update how your name appears across the dashboard.</p>
            </div>
          </div>

          {nameSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
              {nameSuccess}
            </div>
          )}

          {nameError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium">
              {nameError}
            </div>
          )}

          <form onSubmit={handleUpdateName} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter display name"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={adminEmail}
                disabled
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-100 text-sm text-gray-500 cursor-not-allowed select-none"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="bg-[#22c55e] hover:bg-[#16a34a] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isUpdatingProfile ? "Saving..." : "Save Display Name"}
              </button>
            </div>
          </form>
        </div>

        {/* Form 2: Change Password */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-700 flex items-center justify-center border border-gray-200">
              <IoKeyOutline className="text-xl" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Change Password</h2>
              <p className="text-xs text-gray-500">Ensure your account credentials are kept secure.</p>
            </div>
          </div>

          {passSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
              {passSuccess}
            </div>
          )}

          {passError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium">
              {passError}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (minimum 6 characters)"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isChangingPassword}
                className="bg-[#22c55e] hover:bg-[#16a34a] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isChangingPassword ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
