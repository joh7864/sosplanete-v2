import React, {useState, useEffect} from 'react'
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';

import play from '../../assets/cmd/play.svg'
import stop from '../../assets/cmd/stop.svg'
import pause from '../../assets/cmd/pause.svg'

const Player = ({url}) => {

    const audioTune = new Audio( url );

    useEffect(() => {
        audioTune.load();
    }, []);
    
    // play audio sound
    function playSound () {
        audioTune.play();
    };

    // pause audio sound
    function pauseSound () {
        audioTune.pause();

    };

    // stop audio sound
    function  stopSound () {
        audioTune.pause();
        audioTune.currentTime = 0;

    };

  return (
        <AudioPlayer src={url} />
 
  )
}

export default Player