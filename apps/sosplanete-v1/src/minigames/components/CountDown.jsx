import React, { useRef, useEffect, useState } from "react";

export default function Countdown({startCount, style, endOfCountDown, pauseRequest}) {

  const [num, setNum] = useState(startCount);
  const [counterColor, setCounterColor] = useState("black");
  const [counterStyle, setCounterStyle] = useState(style === undefined ? {} : style);
  const [inProgress, setInProgress] = useState(true);


  let intervalRef = useRef();
  
  const decreaseNum = () => setNum((prev) => prev - 1);

  useEffect(() => {
    
    return () => clearInterval(intervalRef.current);

  }, []);

  useEffect(() => {
  
    // Fin du compte à rebours
    if(num <= 0)
    {
        clearInterval(intervalRef.current);

        if( endOfCountDown !== undefined)
          endOfCountDown();
    }

    // Changement de couleur a 50% et 20%
    var percent = num / startCount;
    if(percent < .5 && percent > .2) 
        setCounterColor("orange");
      else{
        if(percent <= .2) 
        setCounterColor("red");
      }
    
    // demande de mise en pause
    if(pauseRequest)
      clearInterval(intervalRef.current);

  }, [num, pauseRequest]);

  useEffect(() => {
    
    // demande reprise du competur
    if(!pauseRequest)
      intervalRef.current = setInterval(decreaseNum, 1000);

  }, [pauseRequest]);
  
  return (
    <div style={counterStyle}>
      <div style={{color: counterColor}} >{num}</div>
    </div>
  );
}