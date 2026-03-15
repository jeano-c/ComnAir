import { IoSearchOutline } from "react-icons/io5";
import { MdArrowDropDown } from "react-icons/md";
import { GiHamburgerMenu } from "react-icons/gi";

// Moved placeholder data here since the header controls the profile
const currentUser = {
  name: "Jeano Cabanjen",
  avatarUrl: "https://i.pravatar.cc/150?img=47",
};

interface HeaderProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export default function Header({ isSidebarOpen, toggleSidebar }: HeaderProps) {
  return (
    <header className="bg-white w-full px-6 py-4 flex items-center justify-between border-b border-gray-200 shadow-sm z-40 shrink-0">
      {/* Left Side: Hamburger Menu */}
      <div className="flex items-center">
        {!isSidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="p-2 -ml-2 mr-4 rounded-lg text-gray-700 hover:bg-green-50 hover:text-[#1F8F22] transition-colors cursor-pointer flex items-center justify-center"
          >
            <GiHamburgerMenu className="text-xl" />
          </button>
        )}
      </div>

      {/* Right Side: Search & Profile */}
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="relative hidden sm:block">
          <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            className="pl-10 pr-4 py-2 w-48 lg:w-64 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1F8F22] text-sm bg-[#f8fafc]"
          />
        </div>

        <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded-lg transition">
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.name}
            className="w-8 h-8 rounded-full object-cover"
          />
          <span className="text-sm font-medium text-gray-700 hidden md:block">
            {currentUser.name}
          </span>
          <MdArrowDropDown className="text-gray-500" />
        </div>
      </div>
    </header>
  );
}