import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, Link } from "react-router";
import { MdOutlineDashboard } from "react-icons/md";
import { CiCreditCard1 } from "react-icons/ci";
import { IoDocumentTextOutline, IoMegaphoneOutline, IoLogOutOutline, IoPersonAddOutline, IoBookOutline } from "react-icons/io5";
import { LuPanelLeftClose, LuPanelLeftOpen } from "react-icons/lu";
import Header from "./Header";
import { useAuth } from "../hooks/useAuth";

export default function Sidebar({ children }: { children?: React.ReactNode }) {
  const location = useLocation();
  const activePath = location.pathname;
  const { logout } = useAuth();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebar_collapsed");
      if (saved !== null) return saved === "true";
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem("sidebar_collapsed", isCollapsed.toString());
  }, [isCollapsed]);

  const menuItems = [
    {
      icon: <MdOutlineDashboard className="w-5 h-5 shrink-0" />,
      label: "Dashboard",
      href: "/",
      isActive: activePath === "/" || activePath.startsWith("/station/"),
    },
    {
      icon: <CiCreditCard1 className="w-5 h-5 shrink-0" />,
      label: "AQI Guide",
      href: "/aqi",
      isActive: activePath === "/aqi",
    },
    {
      icon: <IoDocumentTextOutline className="w-5 h-5 shrink-0" />,
      label: "Reports",
      href: "/reports",
      isActive: activePath.startsWith("/reports"),
    },
    {
      icon: <IoMegaphoneOutline className="w-5 h-5 shrink-0" />,
      label: "Announcements",
      href: "/notification",
      isActive: activePath === "/notification",
    },
    {
      icon: <IoBookOutline className="w-5 h-5 shrink-0" />,
      label: "Admin Manual",
      href: "/manual",
      isActive: activePath === "/manual",
    },
  ];

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] font-sans overflow-hidden">
      {/* --- White Animated Collapsible Sidebar --- */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 76 : 240 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-white border-r border-gray-100 shrink-0 h-full flex flex-col z-30 shadow-xs relative select-none"
      >
        <div className={`flex items-center py-4 border-b border-gray-100 ${isCollapsed ? "justify-center px-2" : "justify-between px-5"}`}>
          {!isCollapsed && (
            <div className="w-36 h-12 overflow-hidden flex items-center justify-center shrink-0">
              {/* ComnAir logo at width 36 with vertical transparent padding cropped */}
              <img
                src="/imgs/comnairlogo.png"
                alt="ComnAir Logo"
                className="w-36 h-36 shrink-0 object-contain select-none"
              />
            </div>
          )}

          {/* Little icon toggle button beside logo */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition cursor-pointer"
            title={isCollapsed ? "Expand sidebar" : "Minimize sidebar"}
          >
            {isCollapsed ? (
              <LuPanelLeftOpen className="w-5 h-5 text-gray-500" />
            ) : (
              <LuPanelLeftClose className="w-5 h-5 text-gray-500" />
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto overflow-x-hidden">
          {menuItems.map((item) => {
            return (
              <Link
                key={item.label}
                to={item.href}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 group ${
                  item.isActive
                    ? "bg-[#22c55e] text-white shadow-xs"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                } ${isCollapsed ? "justify-center px-0" : ""}`}
              >
                <div className={`shrink-0 transition-transform ${!item.isActive && "group-hover:scale-105"}`}>
                  {item.icon}
                </div>
                {!isCollapsed && (
                  <span className="whitespace-nowrap tracking-wide">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section: Create an Account & Logout */}
        <div className="p-3 border-t border-gray-100 space-y-1">
          <Link
            to="/signup"
            title={isCollapsed ? "Create an Account" : undefined}
            className={`flex items-center gap-3.5 w-full px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 group ${
              activePath === "/signup"
                ? "bg-[#22c55e] text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            } ${isCollapsed ? "justify-center px-0" : ""}`}
          >
            <div className={`shrink-0 transition-transform ${activePath !== "/signup" && "group-hover:scale-105"}`}>
              <IoPersonAddOutline className="w-5 h-5" />
            </div>
            {!isCollapsed && <span className="whitespace-nowrap">Create an Account</span>}
          </Link>

          <button
            type="button"
            onClick={logout}
            title={isCollapsed ? "Logout" : undefined}
            className={`flex items-center gap-3.5 w-full px-3.5 py-2.5 rounded-xl font-semibold text-sm text-gray-600 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer group ${
              isCollapsed ? "justify-center px-0" : ""
            }`}
          >
            <div className="shrink-0 transition-transform group-hover:scale-105">
              <IoLogOutOutline className="w-5 h-5" />
            </div>
            {!isCollapsed && <span className="whitespace-nowrap">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* --- Main Content Area --- */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] overflow-hidden">
        {/* Top Header */}
        <Header
          isSidebarOpen={!isCollapsed}
          toggleSidebar={() => setIsCollapsed(!isCollapsed)}
        />

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#f8fafc]">
          {children}
        </div>
      </main>
    </div>
  );
}
