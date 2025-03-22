import React from "react";
import { useStopwatch } from "react-timer-hook";

const StopWatch = ({timerdata}) => {
 
const {milliseconds,seconds,minutes,hours,days,isRunning,start,pause,reset} = timerdata
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "40px" }}>
        <span>{minutes}</span>:<span>{seconds}</span>:<span>{milliseconds}</span>
      </div>
      <button onClick={start}>Start</button>
      <button onClick={pause}>Pause</button>
      <button onClick={() => reset(new Date(), false)}>Reset</button>
    </div>
  );
};

export default StopWatch;
