import React, { useState, useEffect, useCallback } from "react";
import { motion, Variants } from "motion/react";
import { useLocation, useNavigate } from "react-router"; 

// Icons
import { MdOutlineDashboard } from "react-icons/md";
import { IoBarChartOutline, IoSettingsOutline } from "react-icons/io5";
import { CiCreditCard1 } from "react-icons/ci";
import { FaRegQuestionCircle } from "react-icons/fa";

function Sidebar({ children }: { children?: React.ReactNode }) {
  const MIN_WIDTH = 200;
  const MAX_WIDTH = 480;

  const location = useLocation();
  const navigate = useNavigate();
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

  useEffect(() => localStorage.setItem("openSidebar", isOpen.toString()), [isOpen]);
  useEffect(() => localStorage.setItem("sidebarWidth", sidebarWidth.toString()), [sidebarWidth]);

  const startResizing = useCallback(() => setIsResizing(true), []);
  const stopResizing = useCallback(() => setIsResizing(false), []);

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing) {
        const newWidth = mouseMoveEvent.clientX;
        if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
          setSidebarWidth(newWidth);
        }
      }
    },
    [isResizing]
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
    { icon: <MdOutlineDashboard className="w-5 h-5" />, label: "Dashboard", href: "/" },
    { icon: <IoBarChartOutline className="w-5 h-5" />, label: "Analytics", href: "/analytics" },
    { icon: <CiCreditCard1 className="w-5 h-5" />, label: "AQI Guide", href: "/aqi" },
  ];

  const bottomMenuItems = [
    { icon: <FaRegQuestionCircle className="w-5 h-5" />, label: "Help", href: "/help" },
    { icon: <IoSettingsOutline className="w-5 h-5" />, label: "Create an Account", href: "/signup" },
  ];

  const itemVariants: Variants = {
    open: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.05, type: "spring", stiffness: 300, damping: 24 },
    }),
    closed: { opacity: 0, x: -20, transition: { duration: 0.2 } },
  };

  return (
    <div className="flex h-screen bg-[#1F1F1F] font-sans p-2">
      
      {/* Sidebar - Removed outer rounding so it sits flat against the screen edge */}
      <motion.aside
        initial={false}
        animate={{ width: isOpen ? sidebarWidth : 0 }}
        transition={isResizing ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }}
        className="bg-gradient-to-b from-[#28a745] to-[#1e7e34] text-white flex-shrink-0 h-full flex flex-col z-20 overflow-hidden relative"
      >
        <div style={{ width: sidebarWidth }} className="h-full flex flex-col pt-6 pb-6 relative z-10">
          
          {/* Header Section */}
          <div className="px-6 flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center border-2 border-white rounded-full">
                <span className="text-xs">❄️</span> 
              </div>
              <span className="font-bold text-2xl tracking-wide">ComnAir</span>
            </div>
            <motion.button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md hover:bg-white/20 transition-colors"
            >
              ✕
            </motion.button>
          </div>

          <div className="h-px bg-white/20 mx-6 mb-4"></div>

          {/* Main Navigation */}
          <nav className="space-y-2 flex-1 mt-2">
            {mainMenuItems.map((item, i) => {
              const isActive = activePath === item.href;
              return (
                <motion.a
                  key={i}
                  href={item.href}
                  custom={i}
                  initial="closed"
                  animate={isOpen ? "open" : "closed"}
                  variants={itemVariants}
                  className={`flex items-center gap-4 py-3 pl-6 transition-all duration-200 group border-l-4 ${
                    isActive
                      ? "border-white text-white font-semibold bg-white/10"
                      : "border-transparent text-white/80 hover:bg-white/5 hover:text-white"
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.href);
                  }}
                >
                  <div className={`flex-shrink-0 transition-transform duration-200 ${!isActive && "group-hover:scale-110"}`}>
                    {item.icon}
                  </div>
                  <span className="text-[15px]">{item.label}</span>
                </motion.a>
              );
            })}
          </nav>

          <div className="h-px bg-white/20 mx-6 mb-4 mt-6"></div>

          {/* Bottom Navigation */}
          <nav className="space-y-2">
            {bottomMenuItems.map((item, i) => {
              const isActive = activePath === item.href;
              return (
                <motion.a
                  key={i}
                  href={item.href}
                  custom={mainMenuItems.length + i}
                  initial="closed"
                  animate={isOpen ? "open" : "closed"}
                  variants={itemVariants}
                  className={`flex items-center gap-4 py-3 pl-6 transition-all duration-200 group border-l-4 ${
                    isActive
                      ? "border-white text-white font-semibold bg-white/10"
                      : "border-transparent text-white/80 hover:bg-white/5 hover:text-white"
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.href);
                  }}
                >
                  <div className={`flex-shrink-0 transition-transform duration-200 ${!isActive && "group-hover:scale-110"}`}>
                    {item.icon}
                  </div>
                  <span className="text-[15px]">{item.label}</span>
                </motion.a>
              );
            })}
          </nav>
        </div>

        {/* Drag Handle */}
        {isOpen && (
          <div
            onMouseDown={startResizing}
            className="absolute top-0 right-0 h-full w-2 cursor-col-resize z-50 hover:bg-white/20 transition-colors"
          />
        )}
      </motion.aside>

      {/* Main Content Wrapper */}
      <main className="flex-1 relative flex flex-col min-w-0 z-10">
        
        {/* MAGIC FILLER: Identical green gradient hiding directly behind the white rounded corners to remove the gap */}
        {isOpen && (
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-b from-[#28a745] to-[#1e7e34] -z-10" />
        )}

        {/* The White Content Box */}
        <div className="bg-white w-full h-full flex flex-col rounded-l-[2rem] rounded-r-xl shadow-2xl overflow-hidden relative z-10">
          
          {/* Hamburger toggle if sidebar is closed */}
          {!isOpen && (
            <motion.button
              onClick={() => setIsOpen(true)}
              className="absolute top-6 left-6 z-50 p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-700 transition-colors"
            >
              ☰
            </motion.button>
          )}

          {/* Actual page content injected here */}
          <div className="h-full overflow-auto">
            {children}
          </div>

        </div>
      </main>
      
    </div>
  );
}

export default Sidebar;