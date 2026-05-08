async function main() {
  console.log("Appel API pour recalculer l'Eco-Bar-Race...");
  const resp = await fetch('http://localhost:3000/stimulation/eco-bar-race/recalculate?schoolYear=2024-2025', {
    method: 'POST'
  });
  console.log('Status:', resp.status);
  const data = await resp.text();
  console.log('Réponse:', data);
}
main().catch(console.error);
