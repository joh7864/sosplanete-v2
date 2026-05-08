
async function main() {
  const url = 'http://localhost:3000/tracking/stats?instanceId=2&schoolYear=2024-2025';
  console.log(`Fetching ${url}`);
  
  const resp = await fetch(url);
  const data = await resp.json();
  
  console.log('Status:', resp.status);
  console.log('Grand Total:', data.grandTotal);
  console.log('Periods count:', data.periods?.length);
  console.log('Children count:', data.children?.length);
  
  if (data.periods?.length === 0) {
    console.log('Periods array is EMPTY!');
  }
}

main().catch(console.error);
