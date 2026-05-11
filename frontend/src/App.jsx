import React, { useState } from "react";
import LandingPage from "./pages/Landingpage"; // 👈 THIS MUST MATCH YOUR FILE NAME
import LoginPage from "./pages/Login"; // 👈 THIS MUST MATCH YOUR FILE NAME

export default function App() {
  const [currentPage, setCurrentPage] = useState("home");

  return (
    <>
      {currentPage === "home" ? (
        <LandingPage onLoginClick={() => setCurrentPage("login")} />
      ) : (
        <LoginPage onBackClick={() => setCurrentPage("home")} />
      )}
    </>
  );
}
