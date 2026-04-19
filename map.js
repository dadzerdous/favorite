// map.js
export class MapSystem {
    // Generates hazards but AVOIDS the Cardinal Edges (Portal Zones)
    static generateHazards(arenaSize, count = 8) {
        let hazards = [];
        const safeZoneRadius = 80;

        // The four spots the server might spawn a portal
        const portalSpots = [
            { x: 0, y: -400 }, // Top
            { x: 0, y: 400 },  // Bottom
            { x: -400, y: 0 }, // Left
            { x: 400, y: 0 }   // Right
        ];

        for (let i = 0; i < count; i++) {
            let hX, hY, safe;
            let attempts = 0;

            // Try 10 times to find a spot that isn't on a portal
            do {
                safe = true;
                hX = (Math.floor(Math.random() * (arenaSize * 2 / 50)) * 50) - arenaSize;
                hY = (Math.floor(Math.random() * (arenaSize * 2 / 50)) * 50) - arenaSize;

                // Check distance to all potential portal spots
                for (let p of portalSpots) {
                    if (Math.hypot(hX - p.x, hY - p.y) < safeZoneRadius) {
                        safe = false;
                        break;
                    }
                }
                attempts++;
            } while (!safe && attempts < 10);

            if (safe) {
                hazards.push({
                    x: hX, y: hY,
                    type: Math.random() > 0.5 ? 'BARRIER' : 'TRAP'
                });
            }
        }
        return hazards;
    }
}
