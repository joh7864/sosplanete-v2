import React from "react";
import KidLeft from "../../assets/left.svg";
import KidLeftCenter from "../../assets/leftcenter.svg";
import KidRight from "../../assets/right.svg";
import KidRightCenter from "../../assets/rightcenter.svg";

function Kids() {
  return (
    <>
      <div className="flex">
        <img src={KidLeft} />
        <img src={KidLeftCenter} />
        <img src={KidRightCenter} />
        <img src={KidRight} />
      </div>
    </>
  );
}

export default Kids;
