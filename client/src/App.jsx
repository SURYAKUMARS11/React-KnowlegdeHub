import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "./pages/Dashboard";
import Overview from "./pages/Overview";
import Articles from "./pages/Articles";
import ArticleDetails from "./pages/ArticleDetails";
import Categories from "./pages/Categories";
import Tags from "./pages/Tags";
import Contributors from "./pages/Contributors";
import Users from "./pages/Users";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import { ThemeProvider } from "./context/ThemeContext";

function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Overview />} />
          <Route path="articles" element={<Articles />} />
          <Route path="articles/:id" element={<ArticleDetails />} />
          <Route path="categories" element={<Categories />} />
          <Route path="tags" element={<Tags />} />
          <Route path="contributors" element={<Contributors />} />
          <Route path="users" element={<Users />} />
        </Route>
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
