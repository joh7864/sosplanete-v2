import React from 'react';
import './ZoomIn.css'; // Assurez-vous d'avoir ce fichier CSS dans le même répertoire

class ZoomIn extends React.Component {
  render() {
    return (
      <div className="zoom-container">
        {this.props.children}
      </div>
    );
  }
}

export default ZoomIn;