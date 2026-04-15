import { createContext, useState, useContext } from "react";
import { useAuth } from '../utils/AuthContext'
import { NnauruAPI } from './nnauruAPI';

const ApiContext = createContext()

export function ApiProvider({children}) {


    const {user} = useAuth()

    const [loading, setLoading] = useState(false)
    const [teams, setTeams] = useState(null)
    const [categories, setCategories] = useState([])
    const [groups, setGroups] = useState([])
    const [actionsByCategorieId, setActionsByCategorieId] = useState(0)

    const contextData = {
        teams,
        categories,
        actionsByCategorieId,
        groups
    }

    // Appels des différents endpoints de l'API NNauru

     const fetchTeams = async () => {

        setLoading(true)

        // Appel de l'API pour récupérer les équipes
        NnauruAPI.get(user, "/teams", true).then((result) => {
            setTeams(result);
        });

        setLoading(false)
    }

    fetchTeams();

  return (
    <ApiContext.Provider value={contextData}>
        {loading ? <p>Loading...</p> : children}
    </ApiContext.Provider>  )
}

//Custom Hook
export const useApi = () => {return useContext(ApiContext)}

export default ApiContext;