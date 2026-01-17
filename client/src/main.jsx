// client/src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { SnackbarProvider } from "notistack";

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <AuthProvider>
      <SnackbarProvider
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        maxSnack={3}
        autoHideDuration={3000}
        classes={{ containerAnchorOriginTopRight: "snackbar-container" }}
      >
        <App />
      </SnackbarProvider>
    </AuthProvider>
  </React.StrictMode>
);
