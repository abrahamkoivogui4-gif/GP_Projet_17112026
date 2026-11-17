// Crée le compte administrateur (depuis les variables d'environnement) et, avec --demo, des données d'exemple.
import bcrypt from "bcryptjs";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL ?? "postgres://gp:gp@localhost:5432/gp" });
const q = (sql, params) => pool.query(sql, params);

async function upsertUser(name, phone, password, role, verification = "none") {
  const found = await q("select id from users where phone = $1", [phone]);
  if (found.rows[0]) return found.rows[0].id;
  const hash = await bcrypt.hash(password, 10);
  const r = await q(
    "insert into users (name, phone, password_hash, role, verification) values ($1,$2,$3,$4,$5) returning id",
    [name, phone, hash, role, verification],
  );
  return r.rows[0].id;
}

const adminPhone = process.env.ADMIN_PHONE;
const adminPw = process.env.ADMIN_PASSWORD;
if (adminPhone && adminPw) {
  if (!/^\+\d{9,14}$/.test(adminPhone)) throw new Error("ADMIN_PHONE doit être au format international, ex. +33612345678");
  await upsertUser(process.env.ADMIN_NAME ?? "Administrateur", adminPhone, adminPw, "admin", "verified");
  console.log(`Compte admin prêt : ${adminPhone}`);
} else {
  console.log("ADMIN_PHONE / ADMIN_PASSWORD non définis : aucun compte admin créé.");
}

if (process.argv.includes("--demo")) {
  const day = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };
  const BAN = ["Médicaments sans ordonnance", "Argent liquide", "Produits inflammables", "Armes, couteaux"];
  const gps = [
    ["Mariama D.", "+33611111111", "verified"],
    ["Ibrahima S.", "+33622222222", "verified"],
    ["Fatoumata B.", "+33633333333", "verified"],
    ["Mamadou K.", "+224620000001", "verified"],
    ["Oumar F.", "+33644444444", "none"],
  ];
  const ids = [];
  for (const [n, p, v] of gps) ids.push(await upsertUser(n, p, "demo1234", "gp", v));
  const clientId = await upsertUser("Aminata L.", "+33655555555", "demo1234", "client");
  const clientId2 = await upsertUser("Moussa D.", "+33666666666", "demo1234", "client");

  const count = await q("select count(*)::int as n from trips");
  if (count.rows[0].n === 0) {
    const trips = [
      [ids[0], "Paris", "Conakry", day(18), 23, 8, 3, [...BAN, "Poisson séché"]],
      [ids[1], "Lyon", "Conakry", day(25), 15, 9, 7, BAN],
      [ids[2], "Paris", "Kankan", day(32), 20, 10, 3, BAN],
      [ids[3], "Conakry", "Paris", day(15), 30, 7, 1, BAN],
      [ids[4], "Lille", "Conakry", day(35), 25, 8, 7, BAN],
      [ids[0], "Paris", "Labé", day(-20), 20, 8, 3, BAN],
    ];
    const tripIds = [];
    for (const t of trips) {
      const r = await q(
        "insert into trips (gp_id, from_city, to_city, departure_date, capacity_kg, price_per_kg, delivery_days, forbidden_items) values ($1,$2,$3,$4,$5,$6,$7,$8) returning id",
        [...t.slice(0, 7), JSON.stringify(t[7])],
      );
      tripIds.push(r.rows[0].id);
    }
    // Une mise en relation passée, livrée et notée (historique)
    const past = await q(
      "insert into requests (trip_id, client_id, weight_kg, category, description, price_per_kg, status, decided_at, delivered_at) values ($1,$2,5,'Vêtements','Vêtements pour enfants',8,'delivered', now() - interval '25 days', now() - interval '15 days') returning id",
      [tripIds[5], clientId],
    );
    await q("insert into reviews (request_id, gp_id, client_id, stars, comment) values ($1,$2,$3,5,'Colis remis le jour prévu, très sérieuse.')", [past.rows[0].id, ids[0], clientId]);
    // Une demande en attente
    const pend = await q(
      "insert into requests (trip_id, client_id, weight_kg, category, description, price_per_kg) values ($1,$2,8,'Alimentaire','Épices et savon, dans un sac fermé.',8) returning id",
      [tripIds[0], clientId2],
    );
    await q("insert into messages (request_id, sender_id, body) values ($1,$2,'Bonjour, je voudrais envoyer 8 kg (alimentaire) avec vous.')", [pend.rows[0].id, clientId2]);
    console.log("Données de démonstration créées. Mot de passe des comptes de démo : demo1234");
  } else {
    console.log("Des trajets existent déjà : données de démonstration ignorées.");
  }
}

await pool.end();
