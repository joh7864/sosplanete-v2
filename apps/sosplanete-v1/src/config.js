// Config centralisée — les valeurs proviennent des variables d'environnement Vite.
// En dev  : src dans .env (localhost)
// En prod : src dans .env.production (nnauru.net) — utilisé automatiquement lors du build

const config = {
  apiRootUrl:           import.meta.env.VITE_API_ROOT_URL,
  imgRootUrl:           import.meta.env.VITE_IMG_ROOT_URL,
  sosUrl:               import.meta.env.VITE_SOS_URL,
  sosTermoUrl:          import.meta.env.VITE_SOS_TERMO_URL,
  maFicheCategorieUrl:  import.meta.env.VITE_MA_FICHE_CATEGORIE_URL,
  maFicheActionUrl:     import.meta.env.VITE_MA_FICHE_ACTION_URL,
  scoreUrl:             import.meta.env.VITE_SCORE_URL,
  impactUrl:            import.meta.env.VITE_IMPACT_URL,
};

export default config;
