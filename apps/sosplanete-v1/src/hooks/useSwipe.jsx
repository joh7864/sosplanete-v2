import { useState, useEffect } from 'react';

function useSwipe(handleSwipeLeft, handleSwipeRight) {
    const [touchStartX, setTouchStartX] = useState(0);
    const [touchStartY, setTouchStartY] = useState(0);
    const [touchEndX, setTouchEndX] = useState(0);
    const [touchEndY, setTouchEndY] = useState(0);

    function handleTouchStart(e) {
        setTouchStartX(e.targetTouches[0].clientX);
        setTouchStartY(e.targetTouches[0].clientY);
    }

    function handleTouchMove(e) {
        setTouchEndX(e.targetTouches[0].clientX);
        setTouchEndY(e.targetTouches[0].clientY);
    }

    function handleTouchEnd() {

        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        const distance = Math.sqrt (deltaX * deltaX + deltaY * deltaY);
        const angle = Math.atan2 (deltaY, deltaX) * 180 / Math.PI;

        const diffX = Math.abs(touchEndX - touchStartX);
        const diffY = Math.abs(touchEndY - touchStartY);

        //console.log("deltaX", deltaX)
        //console.log("deltaY", deltaY)
        //console.log("distance", distance)
        //console.log("angle", angle)
        //console.log("--------------")

        // On ne gère pas le swipe vertical ni les micro swipe
        if(diffX > diffY && (distance > 15))
        {
            if (touchEndX < touchStartX) {
                handleSwipeLeft();
            }
            if (touchEndX > touchStartX) {
                handleSwipeRight();
            }
        }

        // réinitialisation
        setTouchStartX(0);
        setTouchEndX(0);
        setTouchStartY(0);
        setTouchEndY(0);
    }

    useEffect(() => {
        window.addEventListener('touchstart', handleTouchStart);
        window.addEventListener('touchmove', handleTouchMove);
        window.addEventListener('touchend', handleTouchEnd);

        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [touchStartX, touchEndX]);

    return;
}

export default useSwipe;
