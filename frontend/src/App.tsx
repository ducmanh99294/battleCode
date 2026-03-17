import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import GamePage from "./pages/GamePage";
import Home from "./components/Home";
import Header from "./components/Header";
import Footer from "./components/Footer";
import './App.css'
import Login from "./components/Login";
import Register from "./components/Register";
import { useAuthContext } from "./context/AuthContext";
import Chat from "./components/Chatbot";
import Matchmaking from "./components/battleCode/Matchmaking";

function App() {
  // const location = useLocation();
  const noHeaderFooterPaths = ["/login", "/register", ];
  const hideHeaderFooter = noHeaderFooterPaths.includes(location.pathname);
  const { fetchMe, fetchDoctor } = useAuth();
  const user = useAuthContext()

  useEffect(() => {
      fetchMe(); // gọi /auth/me → đọc cookie
  }, []);

  useEffect(() => {
    if (user.user?._id && user.user.role === 'doctor') {
      fetchDoctor(user.user._id);
    }
  }, [user.user?._id, user.user?.role]);
  return (
    <div className="App">
      {!hideHeaderFooter && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register/>} />
        <Route path="/making" element={<Matchmaking/>} />
      </Routes>
        {/* <Chat /> */}
      {!hideHeaderFooter && <Footer />}
      
    </div>
  );
}

export default App;