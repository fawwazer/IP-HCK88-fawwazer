import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router";
import Home from "./pages/home";
import Favourite from "./pages/favourite";
import Nav from "./components/nav";
import Login from "./pages/login";
import Register from "./pages/register";
import "./App.css";

function RootLayout() {
  const isLoggedIn =
    localStorage.getItem("token") || localStorage.getItem("access_token");
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
          <Route path="/favourites" element={<Favourite />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
