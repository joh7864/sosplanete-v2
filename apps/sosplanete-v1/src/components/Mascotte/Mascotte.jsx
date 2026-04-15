import React, { useEffect } from 'react';
import './Mascotte.css';
import mascotte from '../../assets/mascotte.svg'

function Mascotte({ ...props }) {

    const [viewMessage, setViewMessage] = React.useState();
    const [mascotteOn, setMascotteOn] = React.useState();

    // FONCTION pour changer le statut
    const handleViewState = (state) => {
        setViewMessage(state);
    }

    // FONCTION pour changer le statut
    const handleMascotteState = (state) => {
		
        setMascotteOn(state);

        // Stockage de l'état de la mascotte
		if(state)
		{
			localStorage.setItem('mascotte',  "on");
            if(props?.onStateChanged)
                props?.onStateChanged(true)
		}
		else
		{
			localStorage.setItem('mascotte',  "off");
            if(props?.onStateChanged)
                props?.onStateChanged(false)
		}
    }

    // EVENT : Une des valeur des props à bougé
    useEffect(() => {

        if(!viewMessage && props?.onClosed !== undefined)
            props?.onClosed();

    }, [viewMessage]);

    // EVENT : On force la mise à jour
    useEffect(() => {

    }, [props?.lastUpdate]);

    // EVENT : Une des valeur des props à bougé
    useEffect(() => {

        if(mascotteOn)
        {
            // Astuce, si le titre est vide...on ne réactive pas la bulle
            if(!viewMessage && (props?.titre !== undefined && props?.titre !== "" ))
            {
                handleViewState(true)
            }
        }
        else
        {
            if(props?.onClosed !== undefined)
                props?.onClosed();           
        }

	}, [props?.titre, props.ligne1, props?.ligne2, props?.lastUpdate]);

    // MOUNT du composant
	useEffect(() => {

		// Récupération du dernier étatsauvegardé
		let localStorageState = (localStorage.getItem('mascotte') === "on") ? true : false;
		handleMascotteState(localStorageState);

        if(localStorageState)

            handleViewState(true);

		return () =>  {
		}

	}, []);

  return (
    <>
    <div className="mascotte-container" 
        id={props?.mascotteId}>


        <div className={mascotteOn ? "mascotte" : "mascotte-disable" } onClick={() => handleMascotteState(!mascotteOn)}>
            <img src={mascotte} />
            {!mascotteOn && <span className='text-over-image'>Zz</span>}
            
        </div>

        {(mascotteOn && viewMessage && props?.titre !== "" ) && (
            <>
                <div
                className="message-container"
                onClick={() => handleViewState(!viewMessage)}
                >
                {props?.titre !== "" && <h1>{props?.titre}</h1>}

                <p dangerouslySetInnerHTML={{ __html: props?.ligne1 }}></p>
                
                <p dangerouslySetInnerHTML={{ __html: props?.ligne2 }}></p>

                <div>{props?.children}</div>

            </div>

            <div className='bulle' style={{color: "blue"}}></div>

            </>

            
        )}


    </div>

</>  )
}

export default Mascotte