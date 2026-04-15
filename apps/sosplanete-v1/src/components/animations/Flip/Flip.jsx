import React from 'react';
import './Flip.css'; // Assurez-vous d'avoir ce fichier CSS dans le même répertoire

class Flip extends React.Component {
  render() {
    const { direction = 'vertical', delay = '0s', children } = this.props;
    const className = `flip-container ${direction}`;

    return (
      <div className={className} style={{ animationDelay: delay }}>
        <div className="flipper">
          <div className="front">
            {children}
          </div>
          <div className="back">
            {/* Le contenu à afficher lors du flip */}
            <p>Contenu au dos</p>
          </div>
        </div>
      </div>
    );
  }
}

export default Flip;