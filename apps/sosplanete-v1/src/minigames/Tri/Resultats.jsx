import React from 'react'
import etoile from '../images/etoile.svg'
import redcross from '../images/redcross.svg'
//import nextArrow from '../images/next-arrow.svg'
import chat from '../../assets/mascotte.svg'
import ZoomIn from '../../components/animations/ZoomIn/ZoomIn'
import SlideIn from '../../components/animations/Slides/SlideIn/SlideIn'
import { useTriGame } from './TriGameContext';
import Kids from '../components/Kids'

function Resultats({...props}) {

  const { 
    resultats,
    bonnesReponses,
    tentativesMax,
    gameAborted,
    setGameOver,
    setStartGame,
    gameOverTime
  } = useTriGame();

  const styleTextGain = {
    textDecoration: "none",
    color: "green",
    fontWeight: 700
  }
  const styleTextPerte = {
    textDecoration: "line-through",
    color: "red",
    fontStyle: "italic",
    fontWeight: 300
  }

  return (
    <>
      <div style={{display: "flex",
                  gap: "30px",
                  minHeight: "100%",
                  width: "100%",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  textAlign: "center",
                  marginBottom: "200px"
                  }}>
          <ZoomIn>
            <div className='game-narrator'>
              <img src={chat}/> 
            </div>
          </ZoomIn>

          <ZoomIn>
            <div className='game-text-result'>

              {gameOverTime && <><strong>Oops ! </strong>le temps limite a été dépassé, dommage !<br></br></>}
              {gameAborted && <><strong>Tu as abandonné ! </strong>Ce n'est pas grave, tu feras mieux la prochaine fois !<br></br></>}

              {resultats.filter((r) => r.statut == false).length == 0 ? (
                <>Fantastique ! tu n'as que des bonnes réponses. <strong>Tu es un as</strong> dans le tri des déchets !</>
              ) : (
                <>Tu as obtenu <strong>{resultats.filter((r) => r.statut).length}</strong> bonne(s) réponse(s) !</>
              )}

            </div>
          </ZoomIn>


          <div style={{display: "flex",
                        gap: "10px",
                        justifyContent: "center",
                        alignItems: "center",
                        flexWrap: "wrap",
                        textAlign: "center",
                        }}>
            {resultats.map((item, index) => (
                <div  className='game-res-item'
                    key={index} style={{ backgroundColor: item.statut ? "rgb(255, 243, 234, .3)" : "rgb(255, 190, 0, .3)"}}>
                  <div className='game-res-item-icon'>{item.statut ? <img src={etoile} /> : <img src={redcross} /> }</div>
                  <div className='game-res-item-texte'>{item.dechet.name}</div>
                  <div className='game-res-item-texte' style={item.statut ? styleTextGain : styleTextPerte}>{item.dechet.trash}</div>
                    
                </div>
              ))}  
            </div>
            <Kids/>
            <SlideIn>
              <div className='game-new' onClick={() => setStartGame(true)}>
                Si tu veux <strong>rejouer</strong> clique ici !
              </div>
            </SlideIn>

        </div>
    </>
  )
}

export default Resultats