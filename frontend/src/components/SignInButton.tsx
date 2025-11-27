import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../authConfig";

export const SignInButton = () => {
  const { instance } = useMsal();

  const handleLogin = () => {
    instance.loginPopup(loginRequest).catch((e) => {
      console.error(e);
    });
  };

  return (
    <button onClick={handleLogin} className="sign-in-button">
      Sign in with Microsoft
    </button>
  );
};
