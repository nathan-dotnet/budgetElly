import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext"; // adjust path if needed
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <HashRouter>
      <App />
    </HashRouter>
  </AuthProvider>,
);
