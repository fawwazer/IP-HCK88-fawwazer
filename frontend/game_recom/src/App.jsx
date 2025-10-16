import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router";
import Home from "./pages/home";
import Nav from "./components/nav";
import Login from "./pages/login";
import Register from "./pages/register";

function RootLayout() {
  const isLoggedIn = localStorage.getItem("token");
  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }
  return (
    <>
      <Nav />
      <Outlet />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route element={<RootLayout />}>
          <Route path="/" element={<Home />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
