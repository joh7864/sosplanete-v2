// Script de diagnostic : appeler PATCH /instances/2 avec une date de début raccourcie
// pour provoquer le 409 et voir exactement ce que renvoie l'API
async function main() {
  const API = 'http://localhost:3000';

  // D'abord, lire la config actuelle
  console.log("1) Lecture config actuelle...");
  const configResp = await fetch(`${API}/stimulation/game-config/2?schoolYear=2024-2025`);
  const config = await configResp.json();
  console.log("Config actuelle:", config);

  // Essayer d'enregistrer avec une date de fin raccourcie (pour supprimer des périodes)
  // On prend une date de fin très proche du début pour forcer la suppression de périodes
  const newEndDate = "2025-01-01"; // date qui supprime des périodes
  console.log(`\n2) PATCH avec gameEndDate=${newEndDate}...`);
  const patchResp = await fetch(`${API}/instances/2`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      schoolYear: '2024-2025',
      gameStartDate: "2024-11-01T00:00:00.000Z",
      gameEndDate: new Date(newEndDate).toISOString(),
      gamePeriodsCount: 8,
    })
  });
  console.log("Status:", patchResp.status);
  const patchData = await patchResp.json();
  console.log("Réponse brute:", JSON.stringify(patchData, null, 2));

  // Maintenant, relire la config pour voir si elle a été modifiée malgré le 409
  console.log("\n3) Relecture config après le PATCH...");
  const configRespAfter = await fetch(`${API}/stimulation/game-config/2?schoolYear=2024-2025`);
  const configAfter = await configRespAfter.json();
  console.log("Config après:", configAfter);

  if (config.gameEndDate !== configAfter.gameEndDate) {
    console.log("\n❌ PROBLÈME CONFIRMÉ: La config a été modifiée malgré le 409 !");
  } else {
    console.log("\n✅ OK: La transaction a bien annulé les changements.");
  }
}
main().catch(console.error);
