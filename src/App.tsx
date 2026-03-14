import { createBrowserRouter, Outlet, RouterProvider } from "react-router"; 
import Sidebar from "./components/Sidebar";
import Home from "./pages/Dashboard"; // Adjust the file name if you saved it as Home.tsx
import Analytics from "./pages/Analytics";
import Aqi from "./pages/Aqi";
import "./App.css";

// The Layout passes the active page (Outlet) directly into the Sidebar as children
function Layout() {
  return (
    <Sidebar>
      <Outlet />
    </Sidebar>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true, // This is the default page that loads at "/"
        element: <Home />,
      },
      {
        path: "analytics", // Loads at "/analytics"
        element: <Analytics />,
      },
      {
        path: "aqi", // Loads at "/aqi"
        element: <Aqi />,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;