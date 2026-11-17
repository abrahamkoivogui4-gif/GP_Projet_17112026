// Applique les migrations SQL du dossier ./drizzle (à lancer avant le démarrage).
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

const url = process.env.DATABASE_URL ?? "postgres://gp:gp@localhost:5432/gp";
const pool = new pg.Pool({ connectionString: url });

for (let i = 1; i <= 15; i++) {
  try {
    await pool.query("select 1");
    break;
  } catch (e) {
    if (i === 15) throw e;
    console.log(`Base de données pas encore prête (tentative ${i}/15)…`);
    await new Promise((r) => setTimeout(r, 2000));
  }
}

await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
console.log("Migrations appliquées.");
await pool.end();
