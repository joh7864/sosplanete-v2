import React from 'react';
import './Impact.css';

const ImpactCard = ({ keycard, icon, title, content, complementInfo, showDescription }) => {
	return (
		<>
			<div key={keycard} className="impact-card-container">
				<div className="impact-card-icon">
					<img src={icon} />
				</div>
				<div className="impact-card-infos-container">
					<div className="impact-card-info-title">{title}</div>
					<div className="impact-card-info-text">{content}</div>
					{showDescription && (
						<div className="impact-card-info-complement">{complementInfo}</div>
					)}
				</div>
			</div>
		</>
	);
};

export default ImpactCard;
