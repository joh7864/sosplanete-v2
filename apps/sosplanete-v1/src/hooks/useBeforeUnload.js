import { useEffect, useState } from "react";

const useBeforeUnload = ({ msg }) => {
  const [userMessage, setUserMessage] = useState(
    msg === undefined ? "Attention, Tu va quitter l'application !" : msg
  );

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      window.location.href = "/";
      history.push(null);

      console.log("Actualisation de la page");
      event.preventDefault();
      console.log("Redirection");
      event.returnValue = "";
      return userMessage;
    };

    // Add the event listener when the component mounts
    window.addEventListener("beforeunload", handleBeforeUnload);
    console.log("Add handler beforeunload");

    // Remove the event listener when the component unmounts
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      console.log("remove handler beforeunload");
    };
  }, []);

  return userMessage;
};

export default useBeforeUnload;
