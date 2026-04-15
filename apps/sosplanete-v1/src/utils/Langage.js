// Recherche du prochain jeu disponible
export function t(textes, categorieAge, key) {
  // les 3 paramètres doivent être présent
  if (textes !== null && categorieAge !== null && key !== null) {
    // Recherche de la catégorie d'âge
    let cat = textes.filter((t) => t.categorieAge === categorieAge);
    if (cat.length > 0) {
      //
    } else {
      cat = textes.filter((t) => t.categorieAge === "default");
    }
    const text = cat[0].textes.filter((t) => t.key === key);
    if (text.length > 0) return text[0].text;
  }
  // Par défaut on renvoie le premier jeu
  return "?";
}
