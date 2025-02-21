import { useEffect, useState } from "react";

// TODO: This is a temporary solution to hide the email provider on mobile devices.
export const useCleanupEmailProvider = ({
  isMobile,
  authenticated,
}: {
  isMobile: boolean;
  authenticated: boolean;
}) => {
  const [isRemoved, setIsRemoved] = useState(false);
  useEffect(() => {
    if (!isMobile || authenticated) return;

    let intervalId: NodeJS.Timeout;

    // Hides the 3rd parent of the input element with id: email-input.
    function hideEmailInput() {
      if (!isRemoved) {
        const emailInput = document.getElementById("email-input");
        if (
          emailInput &&
          emailInput.parentElement?.parentElement?.parentElement
        ) {
          emailInput.parentElement.parentElement.parentElement.style.display =
            "none";
          setIsRemoved(true);
          clearInterval(intervalId);
        }
      }
    }
    // Runs the function every 100ms to check if the email input is hidden until it is.
    intervalId = setInterval(hideEmailInput, 100);

    return () => clearInterval(intervalId);
  }, [isMobile, authenticated]);
};
