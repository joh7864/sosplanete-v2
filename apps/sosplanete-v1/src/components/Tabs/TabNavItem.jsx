import React from 'react';
import './Tabs.css';

const TabNavItem = ({ id, title, activeTab, setActiveTab }) => {
	const handleClick = () => {
		setActiveTab(id);
	};

	return (
		<li onClick={handleClick} className={activeTab === id ? 'active' : ''}>
			<div
				className="title"
				style={{ color: activeTab === id ? 'rgb(32, 148, 243)' : 'rgb(35, 31, 31)' }}
			>
				{title}
			</div>
		</li>
	);
};
export default TabNavItem;
