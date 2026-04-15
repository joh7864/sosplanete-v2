import React from 'react'

const Camembert = ({id, count, refTeams}) => {

    const teamName = (id) => {
        var x = refTeams.filter((team) => team.id === id)
        if(x.length > 0)
        {
          return x[0].name;
        }
        else
          return "?";
      }
    
      return (
        <>
          <li key={id}>
            <div>{count}</div>
            <div>{teamName(id)}</div>
          </li>
        </>
      )
    }

export default Camembert