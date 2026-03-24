import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, Variants } from "framer-motion";
import { useLocation, Link } from "react-router";
import { MdOutlineDashboard } from "react-icons/md";
import { IoBarChartOutline, IoSettingsOutline } from "react-icons/io5";
import { CiCreditCard1 } from "react-icons/ci";
import { FaRegQuestionCircle } from "react-icons/fa";
import { HiOutlineX } from "react-icons/hi";
import Header from "./Header";


function Sidebar({ children }: { children?: React.ReactNode }) {
  const MIN_WIDTH = 200;
  const MAX_WIDTH = 480;
  const MemoChildren = useMemo(
    () => <div className="flex-1 overflow-auto">{children}</div>,
    [children],
  );

  const location = useLocation();
  const activePath = location.pathname;

  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== "undefined") {
      const savedState = localStorage.getItem("openSidebar");
      if (savedState !== null) return savedState === "true";
    }
    return true;
  });

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window !== "undefined") {
      const savedWidth = localStorage.getItem("sidebarWidth");
      if (savedWidth !== null) {
        const parsedWidth = parseInt(savedWidth, 10);
        if (!isNaN(parsedWidth)) return parsedWidth;
      }
    }
    return 260;
  });

  const [isResizing, setIsResizing] = useState(false);

  useEffect(
    () => localStorage.setItem("openSidebar", isOpen.toString()),
    [isOpen],
  );
  useEffect(
    () => localStorage.setItem("sidebarWidth", sidebarWidth.toString()),
    [sidebarWidth],
  );

  const startResizing = useCallback(() => setIsResizing(true), []);
  const stopResizing = useCallback(() => setIsResizing(false), []);

  const resizeRef = React.useRef<number | null>(null);

  const sidebarRef = React.useRef<HTMLElement>(null);

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (!isResizing) return;
      if (resizeRef.current) cancelAnimationFrame(resizeRef.current);

      resizeRef.current = requestAnimationFrame(() => {
        const newWidth = mouseMoveEvent.clientX;
        if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
          // Mutate DOM directly — zero re-renders
          if (sidebarRef.current) {
            sidebarRef.current.style.width = `${newWidth}px`;
          }
          setSidebarWidth(newWidth); // keep for persistence only
        }
      });
    },
    [isResizing],
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
      document.body.style.userSelect = "none";
    } else {
      document.body.style.userSelect = "auto";
    }
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  const mainMenuItems = [
    {
      icon: <MdOutlineDashboard className="w-5 h-5" />,
      label: "Dashboard",
      href: "/",
    },
    {
      icon: <IoBarChartOutline className="w-5 h-5" />,
      label: "Analytics",
      href: "/analytics",
    },
    {
      icon: <CiCreditCard1 className="w-5 h-5" />,
      label: "AQI Guide",
      href: "/aqi",
    },
  ];

  const bottomMenuItems = [
    {
      icon: <FaRegQuestionCircle className="w-5 h-5" />,
      label: "Help",
      href: "/help",
    },
    {
      icon: <IoSettingsOutline className="w-5 h-5" />,
      label: "Create an Account",
      href: "/signup",
    },
  ];

  const itemVariants: Variants = {
    open: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.03,
        type: "tween",
        ease: "easeOut",
        duration: 0.25,
      },
    }),
    closed: { opacity: 0, x: -10, transition: { duration: 0.15 } },
  };

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] font-sans overflow-hidden">
      <motion.aside
        initial={false}
        animate={{ width: isOpen ? sidebarWidth : 0 }}
        transition={
          isResizing
            ? { duration: 0 }
            : { type: "tween", ease: "easeInOut", duration: 0.3 }
        }
        style={{ willChange: "width" }}
        className="bg-[#1F8F22] text-white shrink-0 h-full flex flex-col z-20 overflow-hidden relative"
      >
        <div
          style={{ width: sidebarWidth }}
          className="h-full flex flex-col pt-6 pb-6 relative z-10"
        >
          <div className="px-6 flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <img src="/imgs/logo.png" alt="ComnAir Logo" />
              </div>
              <span className="font-bold text-2xl tracking-wide">ComnAir</span>
            </div>
            <motion.button
              onClick={() => setIsOpen(false)}
              className="px-1.5 py-1 rounded-md hover:bg-white/20 transition-colors"
            >
              <HiOutlineX className="text-2xl cursor-pointer" />
            </motion.button>
          </div>

          <hr className="w-full h-1.5 text-[#ADAFAA] mb-4 rounded-full" />

          <nav className="space-y-2 flex-1 mt-2">
            {mainMenuItems.map((item, i) => {
              const isActive = activePath === item.href;
              return (
                <motion.div
                  key={i}
                  custom={i}
                  initial="closed"
                  animate={isOpen ? "open" : "closed"}
                  variants={itemVariants}
                >
                  <Link
                    to={item.href}
                    className={`flex items-center gap-4 py-3 pl-6 transition-all duration-200 group border-l-4 ${isActive ? "border-white text-white font-semibold bg-white/10" : "border-transparent text-white/80 hover:bg-white/5 hover:text-white"}`}
                  >
                    <div
                      className={`shrink-0 transition-transform duration-200 ${!isActive && "group-hover:scale-110"}`}
                    >
                      {item.icon}
                    </div>
                    <span className="text-[15px]">{item.label}</span>
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          <div className="h-px bg-white/20 mx-6 mb-4 mt-6"></div>

          <nav className="space-y-2">
            {bottomMenuItems.map((item, i) => {
              const isActive = activePath === item.href;
              return (
                <motion.div
                  key={i}
                  custom={mainMenuItems.length + i}
                  initial="closed"
                  animate={isOpen ? "open" : "closed"}
                  variants={itemVariants}
                >
                  <Link
                    to={item.href}
                    className={`flex items-center gap-4 py-3 pl-6 transition-all duration-200 group border-l-4 ${isActive ? "border-white text-white font-semibold bg-white/10" : "border-transparent text-white/80 hover:bg-white/5 hover:text-white"}`}
                  >
                    <div
                      className={`shrink-0 transition-transform duration-200 ${!isActive && "group-hover:scale-110"}`}
                    >
                      {item.icon}
                    </div>
                    <span className="text-[15px]">{item.label}</span>
                  </Link>
                </motion.div>
              );
            })}
          </nav>
        </div>

        {isOpen && (
          <div
            onMouseDown={startResizing}
            className="absolute top-0 right-0 h-full w-2 cursor-col-resize z-50 hover:bg-white/20 transition-colors"
          />
        )}
      </motion.aside>

      {/* --- Main Content Area --- */}
      <main className="flex-1 relative flex flex-col min-w-0 z-10 bg-[#f8fafc]">
        {isOpen && (
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#1F8F22] -z-10" />
        )}

        <div
          className={`bg-[#f8fafc] w-full h-full flex flex-col shadow-2xl overflow-hidden relative z-10 transition-all duration-300 ${isOpen ? "rounded-l-4xl rounded-r-xl" : "rounded-none"}`}
        >
          {/* INJECTED HEADER COMPONENT */}
          <Header
            isSidebarOpen={isOpen}
            toggleSidebar={() => setIsOpen(true)}
          />

          {/* Actual page content wrapper */}
          {MemoChildren}
        </div>
      </main>
    </div>
  );
}

export default Sidebar;
