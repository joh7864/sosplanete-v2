import React, { useEffect, useState } from "react";
import appcfg from "../../config.js";
import useBreakpoints from "../../hooks/useBreakpoints";

const Histogramme = ({ id, count, refTeams, totalActions }) => {
  const [name, setName] = useState("?");
  const [color, setColor] = useState("gray");
  const [image, setImage] = useState("");
  const [value, setValue] = useState(0);

  const breakPoint = useBreakpoints();

  useEffect(() => {
    const x = refTeams.filter((team) => team.id === id);
    if (x.length > 0) {
      setName(x[0].name);
      setColor(x[0].color || "gray");
      setImage(appcfg.imgRootUrl + x[0].icon);
    }
  }, [id, refTeams]);

  useEffect(() => {
    if (totalActions > 0) {
      // Scale height relative to a max height of 160px for the bar
      const percentage = count / totalActions;
      setValue(percentage * 160);
    } else {
      setValue(0);
    }
  }, [count, totalActions]);

  return (
    <div className="histogram-column" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: breakPoint.isMobile ? '50px' : '75px' }}>
      <div className="histogram-bar-wrapper" style={{ height: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', width: '100%', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ textAlign: "center", fontWeight: 700, fontSize: breakPoint.isMobile ? '0.8rem' : '0.95rem', color: '#1e293b', marginBottom: '4px' }}>
          {count}
        </div>
        <div
          style={{
            width: breakPoint.isMobile ? '36px' : '52px',
            height: `${Math.max(12, value)}px`,
            backgroundColor: color,
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            boxShadow: `0 4px 15px ${color}30`,
            transition: 'all 0.5s ease-in-out',
          }}
        ></div>
      </div>
      <div style={{ textAlign: "center", fontSize: breakPoint.isMobile ? '0.7rem' : '0.85rem', fontWeight: 600, color: '#334155', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {name}
      </div>
      {(breakPoint.isMobile || breakPoint.isTablet) && (
        <img src={image} style={{ width: 32, height: 32, marginTop: '4px' }} alt="" />
      )}
    </div>
  );
};

export default Histogramme;
