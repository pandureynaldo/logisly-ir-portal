import { WebStorageStateStore } from "oidc-client-ts";
import type { AuthProviderProps } from "react-oidc-context";

const authority =
  import.meta.env.VITE_AUTH_ISSUER ??
  "https://auth.logisly.id/realms/org-wide";
const clientId =
  import.meta.env.VITE_AUTH_CLIENT_ID ?? "logisly-connect";

export const oidcConfig: AuthProviderProps = {
  authority,
  client_id: clientId,
  redirect_uri: `${window.location.origin}/oauth/callback`,
  post_logout_redirect_uri: window.location.origin,
  scope: "openid profile email offline_access",
  response_type: "code",
  automaticSilentRenew: true,
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, "/report");
  },
};
