import { useMsal } from "@azure/msal-react";

export const SignOutButton = () => {
  const { instance } = useMsal();

  const handleLogout = () => {
    instance.logoutPopup().catch((e) => {
      console.error(e);
    });
  };

  return (
    <button onClick={handleLogout} className="sign-out-button">
      Sign out
    </button>
  );
};
