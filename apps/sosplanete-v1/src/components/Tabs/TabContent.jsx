import React from "react";
 
const TabContent = ({id, activeTab, children}) => {
 return (
   activeTab === id ? <div className="tabs-content-container">
     { children }
   </div>
   : null
 );
};

export default TabContent;
