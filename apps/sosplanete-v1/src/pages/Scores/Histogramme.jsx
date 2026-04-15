import React, { useEffect, useState } from "react";
import appcfg from "../../config.json";
import useBreakpoints from "../../hooks/useBreakpoints";

const Histogramme = ({ id, count, refTeams, totalActions }) => {
  const PIXEL_PAR_UNITE = 3.5;

  const [value, setValue] = useState(0.0);
  const [name, setName] = useState("?");
  const [color, setColor] = useState("gray");
  const [image, setImage] = useState("");

  const breakPoint = useBreakpoints();

  useEffect(() => {
    //if (breakPoint.isMobile) setRatio(2);

    var x = refTeams.filter((team) => team.id === id);
    if (x.length > 0) {
      setName(x[0].name);
      setColor(x[0].color);
      setImage(appcfg.imgRootUrl + x[0].icon);
    }

    if (totalActions > 0)
      setValue(
        (count / totalActions) *
          100 *
          (breakPoint.isMobile ? 2 : PIXEL_PAR_UNITE)
      );

    return () => {};
  });

  return (
    <>
      <div className="cv" style={{ gap: 5 }}>
        <div
          style={{
            width: 50,
            height: value,
            backgroundColor: color,
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
          }}
        ></div>
        <div style={{ textAlign: "center", fontWeight: 600 }}>{count}</div>

        <div
          style={{ textAlign: "center", fontSize: "0.6rem", fontWeight: 700 }}
        >
          {name}
        </div>

        {(breakPoint.isMobile || breakPoint.isTablet) && (
          <>
            <img src={image} style={{ width: 40, height: 40 }} />
          </>
        )}
      </div>
    </>
  );
};

export default Histogramme;
