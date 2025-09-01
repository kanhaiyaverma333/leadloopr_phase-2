import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import FormPage from "./FormPage.jsx";
import EmployeeForm from "./EmployeeForm.jsx";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/user" element={<FormPage />} />
      <Route path="/company" element={<EmployeeForm />} />
    </Routes>
  </BrowserRouter>
);
