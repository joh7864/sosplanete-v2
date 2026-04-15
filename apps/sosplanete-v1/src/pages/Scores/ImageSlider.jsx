import React, { useState, useEffect, useRef } from 'react';

const ImageSlider = ({ images, repetitions, replay, duree = 1500, onAnimationEnded }) => {
  const [index, setIndex] = useState(0);

    let indexImage = useRef(0);
    let running = useRef(false); 

    useEffect(() => {
      indexImage.current = 0;
      setIndex(0);

    }, [])

    useEffect(() => {
      indexImage.current = 0;
      setIndex(0);
      return () => {
      }
    }, [replay])

    useEffect(() => {

        const timer = setInterval(() => {

            indexImage.current = indexImage.current + 1;
            console.log("Animal n°", indexImage.current);
            setIndex(indexImage.current);

            // Fin de la série d'images
            if(indexImage.current > images.length-1)
            {
              clearInterval(timer);
              indexImage.current  = images.length - 1

              // Evènement de Fin de l'animation
              onAnimationEnded()
            }

        }, duree);

        return () => clearInterval(timer);

    }, [images]);

  return (
    <>
      {images.length > 0 &&
        <img src={images[indexImage.current]?.icon} alt="image slider" />
      }
    </>
  );
};

export default ImageSlider;
