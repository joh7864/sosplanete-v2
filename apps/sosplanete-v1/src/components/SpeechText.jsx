/* eslint-disable react/prop-types */
import { useCallback, useEffect, useState } from "react";
import { AiFillSound } from "react-icons/ai";

const SpeechText = ({ textToSpeech, autoplay = false }) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);

    return () => {};
  }, []);

  useEffect(() => {
    if (autoplay) speak();

    return () => {};
  }, [autoplay, loaded, speak]);

  useEffect(() => {
    if (autoplay) speak();

    return () => {};
  }, [autoplay, speak, textToSpeech]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const speak = useCallback(() => {
    const utterance = new SpeechSynthesisUtterance(textToSpeech);
    window.speechSynthesis.speak(utterance);
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 15,
      }}
    >
      <AiFillSound onClick={() => speak()} />
      <p style={{ cursor: "pointer" }} onClick={() => speak()}>
        {textToSpeech}{" "}
      </p>
    </div>
  );
};

export default SpeechText;
