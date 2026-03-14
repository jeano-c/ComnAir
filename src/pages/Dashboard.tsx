import React from "react";
import { IoSearchOutline } from "react-icons/io5";
import { FaBell } from "react-icons/fa";

function Home() {
  return (
    <div className="p-8 md:p-12 h-full flex flex-col">
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        
        <h1 className="text-3xl font-bold text-[#1a1a1a]">Overview</h1>

        {/* Search, Notifications, Profile */}
        <div className="flex items-center gap-6">
          {/* Search Bar */}
          <div className="relative">
            <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              className="pl-10 pr-4 py-2 w-64 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            />
          </div>

          {/* Notification Bell */}
          <button className="relative text-gray-700 hover:text-green-600 transition">
            <FaBell className="w-5 h-5" />
            {/* Red dot badge */}
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-lg">
            <img
              src="https://i.pravatar.cc/150?img=47" // Placeholder image
              alt="Jeano Cabanjen"
              className="w-8 h-8 rounded-full object-cover"
            />
            <span className="text-sm font-medium text-gray-700">Jeano Cabanjen</span>
            <span className="text-xs text-gray-400">▼</span>
          </div>
        </div>
      </div>

      {/* Action Row */}
      <div className="flex justify-end mb-6">
        <button className="bg-[#28a745] hover:bg-[#218838] text-white px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center gap-2 shadow-sm">
          <span>+</span> Add Location
        </button>
      </div>

      {/* Main Content Area (AQI Card) */}
      <div className="bg-gradient-to-r from-[#62a66e] to-[#97b69b] rounded-xl shadow-md p-4 flex flex-col md:flex-row items-center justify-between text-white relative overflow-hidden">
        
        {/* Left Side: Status & Title */}
        <div className="flex items-center gap-4 z-10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-green-300 rounded-full animate-pulse"></span>
            <span className="text-xs font-semibold tracking-wider uppercase">Active</span>
          </div>
          <h2 className="text-lg font-bold tracking-wide ml-4">PLV MAIN CAMPUS</h2>
        </div>

        {/* Right Side: AQI Badge, Timestamp, Controls */}
        <div className="flex items-center gap-4 z-10 mt-4 md:mt-0">
          {/* AQI Score Badge */}
          <div className="bg-transparent border border-white px-4 py-1 rounded-full font-bold">
            45 AQI
          </div>
          
          <div className="bg-white text-gray-500 text-xs px-3 py-1.5 rounded-md font-medium">
            Last updated: 1 hour ago
          </div>

          <button className="hover:bg-black/10 p-1 rounded transition">
            <span className="text-xl">⋮</span>
          </button>
          
          <button className="hover:bg-black/10 p-1 rounded transition">
            <span className="text-xl">›</span>
          </button>
        </div>

        {/* Optional: Add a subtle background image blending into the card (like your screenshot) */}
        {/* <div className="absolute right-0 top-0 h-full w-1/3 opacity-30 bg-[url('your-building-image.png')] bg-cover bg-center mix-blend-overlay"></div> */}
      </div>

    </div>
  );
}

export default Home;