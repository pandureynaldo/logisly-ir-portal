import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider as OidcProvider } from "react-oidc-context";
import { AuthProvider } from "./auth";
import { oidcConfig } from "./oidc";
import { App } from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <OidcProvider {...oidcConfig}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </OidcProvider>
  </StrictMode>,
);
