import React from 'react';
import './SlideIn.css'; // Assurez-vous d'avoir ce fichier CSS dans le même répertoire

class SlideIn extends React.Component {
  render() {
    const { direction = 'left', speed = '1s', children } = this.props;
    const className = `slide-container ${direction}`;

    return (
      <div className={className} style={{ animationDuration: speed }}>
        {children}
      </div>
    );
  }
}

export default SlideIn;
