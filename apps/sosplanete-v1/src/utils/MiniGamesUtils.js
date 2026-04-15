import packageJson from '../../package.json';

// Initialisation des minijeux
export function initMiniJeux(forced) {

    // Etat des minis jeux
    if(localStorage.getItem("gamesConfig") === null || forced)
    {
        const gamesConfig = {
            enable: true,
            created: packageJson.version,
            miniGames: [
            {
              name: "Tri", 
              enable: false,
              url: "/games/tri",
              config: {
              }
            },
            {
              name: "Quizz",
              enable: false,
              url: "/games/quizz",      
              config: {
              }
            },
            {
              name: "Bataille",
              enable: false,
              url: "/games/bataille",      
              config: {
              }
            }
        ]};
  
        localStorage.setItem('gamesConfig', JSON.stringify(gamesConfig));
    }
  
}

// Recherche du prochain jeu disponible
export function getNextAvailableGame () {

    var cfg = JSON.parse(localStorage.getItem("gamesConfig"));
    var nextAvailableGames = cfg.miniGames.filter((g) => g.enable === false);
    if(nextAvailableGames != null && nextAvailableGames != undefined)
        return nextAvailableGames[0];

    // Par défaut on renvoie le premier jeu
    return cfg.miniGames[0];
}