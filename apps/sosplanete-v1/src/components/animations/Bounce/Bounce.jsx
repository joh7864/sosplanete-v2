import React from 'react';
import './BounceAnimation.css';

class Bounce extends React.Component {
    render() {
        return (
            <div className="bounce">
                {this.props.children}
            </div>
        );
    }
}

export default Bounce;
