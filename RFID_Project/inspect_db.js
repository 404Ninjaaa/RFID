async function run() {
    try {
        const res = await fetch('http://localhost:5001/api/characters');
        const chars = await res.json();
        console.log("--- DB CHARACTERS ---");
        chars.forEach(c => {
            console.log(`ID: ${c.id} (Type: ${typeof c.id}) | Name: ${c.name} | Role: ${c.role}`);
        });
        console.log("---------------------");
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

run();
