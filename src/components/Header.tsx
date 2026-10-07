import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  IoSearchOutline,
  IoNotificationsOutline,
  IoMailOutline,
  IoPersonOutline,
  IoLogOutOutline,
} from "react-icons/io5";
import { GiHamburgerMenu } from "react-icons/gi";
import { useAuth } from "../hooks/useAuth";

interface HeaderProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

interface SearchItem {
  id: string;
  title: string;
  category: string;
  path: string;
  keywords: string[];
}

const SEARCH_REGISTRY: SearchItem[] = [
  {
    id: "dashboard",
    title: "Monitoring Stations",
    category: "Dashboard",
    path: "/",
    keywords: ["dashboard", "monitoring", "stations", "overview", "home", "valenzuela", "quezon", "manila"],
  },
  {
    id: "aqi",
    title: "AQI Guide",
    category: "Guidelines",
    path: "/aqi",
    keywords: ["aqi", "aqi guide", "air quality index", "epa", "scale", "standards", "pollutants"],
  },
  {
    id: "categories",
    title: "Report Categories",
    category: "Management",
    path: "/category",
    keywords: ["categories", "category", "report categories", "types"],
  },
  {
    id: "reports",
    title: "Reports",
    category: "Citizen Reports",
    path: "/reports",
    keywords: ["reports", "citizen reports", "complaints", "incident reports", "issues"],
  },
  {
    id: "notifications",
    title: "Announcements & Alerts",
    category: "Broadcasts",
    path: "/notification",
    keywords: ["announcements", "notifications", "alerts", "spikes", "spike drawer"],
  },
  {
    id: "analytics",
    title: "Analytics",
    category: "Data",
    path: "/analytics",
    keywords: ["analytics", "charts", "trends", "historical"],
  },
  {
    id: "profile",
    title: "Manage Profile",
    category: "Settings",
    path: "/profile",
    keywords: ["profile", "manage profile", "password", "display name", "admin", "account"],
  },
  {
    id: "loc_valenzuela",
    title: "Valenzuela City Station",
    category: "Station",
    path: "/station/5",
    keywords: ["valenzuela", "valenzuela city"],
  },
  {
    id: "loc_quezon",
    title: "Quezon City Station",
    category: "Station",
    path: "/station/6",
    keywords: ["quezon", "quezon city"],
  },
  {
    id: "loc_manila",
    title: "Manila Station",
    category: "Station",
    path: "/station/7",
    keywords: ["manila"],
  },
];

export default function Header({ isSidebarOpen, toggleSidebar }: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [filteredResults, setFilteredResults] = useState<SearchItem[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Filter search items whenever query changes
  useEffect(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) {
      setFilteredResults([]);
      setIsSearchOpen(false);
      return;
    }

    const matches = SEARCH_REGISTRY.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(trimmed);
      const matchCategory = item.category.toLowerCase().includes(trimmed);
      const matchKeyword = item.keywords.some((k) => k.toLowerCase().includes(trimmed));
      return matchTitle || matchCategory || matchKeyword;
    });

    setFilteredResults(matches);
    setIsSearchOpen(true);
  }, [searchQuery]);

  // Click outside listener for dropdown and search results
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsDropdownOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSearchResult = (path: string) => {
    navigate(path);
    setSearchQuery("");
    setIsSearchOpen(false);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (filteredResults.length > 0) {
        handleSelectSearchResult(filteredResults[0].path);
      }
    } else if (e.key === "Escape") {
      setIsSearchOpen(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    logout();
    setIsDropdownOpen(false);
  };

  // Initials generator: first two letters
  const getInitials = (name?: string): string => {
    if (!name || !name.trim()) return "AD";
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.trim().slice(0, 2).toUpperCase();
  };

  const storedName = typeof window !== "undefined" ? localStorage.getItem("admin_name") : null;
  const adminName = storedName || user?.name || "Admin";
  const adminEmail = user?.email || "admin@comnair.com";

  return (
    <header className="bg-white w-full px-6 sm:px-8 py-3.5 flex items-center justify-between border-b border-gray-100 z-40 shrink-0">
      {/* Left Side: Hamburger (if sidebar closed) & Search Bar */}
      <div className="flex items-center gap-3">
        {!isSidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="p-2 -ml-2 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer flex items-center justify-center"
            title="Open Sidebar"
          >
            <GiHamburgerMenu className="text-xl" />
          </button>
        )}

        {/* Search Bar Container */}
        <div className="relative w-64 sm:w-80 md:w-96" ref={searchContainerRef}>
          <div className="relative flex items-center">
            <IoSearchOutline className="absolute left-3.5 text-gray-400 text-lg pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim()) setIsSearchOpen(true);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search location, reports etc..."
              className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200/90 bg-[#f8fafc] text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition"
            />
          </div>

          {/* Search Results Dropdown */}
          {isSearchOpen && (
            <div className="absolute left-0 mt-2 w-full bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 max-h-80 overflow-y-auto">
              {filteredResults.length > 0 ? (
                filteredResults.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectSearchResult(item.path)}
                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center justify-between transition cursor-pointer group"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-800 group-hover:text-emerald-600 transition">
                        {item.title}
                      </span>
                      <span className="text-[11px] text-gray-400 font-medium">
                        {item.category}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 font-mono group-hover:text-emerald-500">
                      {item.path}
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-4 text-center text-xs text-gray-400 font-medium">
                  No matching results found for "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Side: Mail Button, Notification Bell with Green Dot, Profile Avatar */}
      <div className="flex items-center gap-3 sm:gap-3.5">
        {/* Mail Icon Button */}
        <button
          type="button"
          onClick={() => navigate("/reports")}
          className="w-10 h-10 rounded-full border border-gray-200/90 bg-white flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition cursor-pointer"
          title="Citizen Reports & Messages"
        >
          <IoMailOutline className="text-lg" />
        </button>

        {/* Notification Bell Button with Active Green Dot */}
        <button
          type="button"
          onClick={() => navigate("/notification")}
          className="w-10 h-10 rounded-full border border-gray-200/90 bg-white flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition cursor-pointer relative"
          title="Alerts & Announcements"
        >
          <IoNotificationsOutline className="text-xl" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white absolute top-2 right-2" />
        </button>

        {/* Profile Avatar and Dropdown Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-center rounded-full transition cursor-pointer focus:outline-none"
            title="Profile Menu"
          >
            {user?.avatarUrl && !imgError ? (
              <img
                src={user.avatarUrl}
                alt={adminName}
                onError={() => setImgError(true)}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100 hover:ring-emerald-400 transition"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center justify-center select-none ring-2 ring-gray-100 hover:ring-emerald-400 transition">
                {getInitials(adminName)}
              </div>
            )}
          </button>

          {/* Profile Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2.5 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 flex flex-col">
              <div className="px-4 py-2.5 border-b border-gray-100">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Signed in as
                </p>
                <p className="text-sm font-bold text-gray-900 truncate mt-0.5">
                  {adminName}
                </p>
                <p className="text-xs text-gray-500 truncate font-normal">
                  {adminEmail}
                </p>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate("/profile");
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 cursor-pointer transition"
                >
                  <IoPersonOutline className="text-base text-gray-500" />
                  <span>Manage Profile</span>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer transition disabled:opacity-50"
                >
                  <IoLogOutOutline className="text-base text-rose-500" />
                  <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
