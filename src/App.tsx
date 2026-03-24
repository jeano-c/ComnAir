import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
} from "react-router";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Dashboard"; // Adjust the file name if you saved it as Home.tsx
import Analytics from "./pages/Analytics";
import Aqi from "./pages/Aqi";
import Login from "./pages/Login";
import CreateAccount from "./pages/CreateAccount";
import "./App.css";
import { useAuth } from "./hooks/useAuth";

function Layout() {
  return (
    <Sidebar>
      <Outlet />
    </Sidebar>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  // Wait for TanStack Query to finish checking the token
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-gray-200"></div>
            <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-[#1F8F22] border-t-transparent animate-spin"></div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-gray-700 font-medium">Loading session...</p>
            <p className="text-gray-400 text-sm">Please wait</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: (
      <AuthGuard>
        <Layout />
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "analytics",
        element: <Analytics />,
      },
      {
        path: "aqi",
        element: <Aqi />,
      },
      {
        path: "signup",
        element: <CreateAccount />,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
