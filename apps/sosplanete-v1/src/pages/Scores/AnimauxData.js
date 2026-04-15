import ecureuil from "./images/ecureuil.svg"
import ecureuilHidden from "./images/ecureuil hidden.svg"

import loup from "./images/loup.svg"
import loupHidden from "./images/loup hidden.svg"

import lion from "./images/lion.svg"
import lionHidden from "./images/lion hidden.svg"

const Animaux = [
    {
        name: "écureuil",
        visible: {ecureuil},
        hidden: {ecureuilHidden}
    },
    {
        name: "loup",
        visible: {loup},
        hidden: {loupHidden}
    },
    {
        name: "lion",
        visible: {lion},
        hidden: {lionHidden}
    }
]

export default Animaux