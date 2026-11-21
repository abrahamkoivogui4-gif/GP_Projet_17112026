import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  smallint,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["client", "gp", "admin"]);
export const verificationEnum = pgEnum("verification_status", ["none", "pending", "verified", "refused"]);
export const tripStatusEnum = pgEnum("trip_status", ["active", "suspended", "cancelled"]);
export const requestStatusEnum = pgEnum("request_status", ["pending", "accepted", "refused", "delivered", "cancelled"]);
export const docStatusEnum = pgEnum("document_status", ["pending", "approved", "refused"]);
export const reportStatusEnum = pgEnum("report_status", ["new", "in_progress", "closed"]);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    phone: text("phone").notNull(), // format international : +33612345678
    passwordHash: text("password_hash").notNull(),
    recoveryHash: text("recovery_hash"), // code de récupération (haché) pour réinitialiser le mot de passe
    role: roleEnum("role").notNull().default("client"),
    verification: verificationEnum("verification").notNull().default("none"),
    suspended: boolean("suspended").notNull().default(false),
    email: text("email"), // facultatif, pour les notifications par e-mail
    emailNotify: boolean("email_notify").notNull().default(false), // le GP veut un e-mail à chaque nouvelle demande
    deletedAt: timestamp("deleted_at", { withTimezone: true }), // compte supprimé par son titulaire (données anonymisées)
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_phone_idx").on(t.phone)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(), // empreinte SHA-256 du jeton du cookie
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const trips = pgTable(
  "trips",
  {
    id: serial("id").primaryKey(),
    gpId: integer("gp_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    fromCity: text("from_city").notNull(),
    toCity: text("to_city").notNull(),
    departureDate: date("departure_date", { mode: "string" }).notNull(),
    capacityKg: integer("capacity_kg").notNull(),
    pricePerKg: integer("price_per_kg").notNull(), // en euros entiers
    deliveryDays: integer("delivery_days").notNull(), // délai de remise après l'arrivée
    forbiddenItems: jsonb("forbidden_items").$type<string[]>().notNull().default([]),
    status: tripStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("trips_search_idx").on(t.fromCity, t.toCity, t.departureDate), index("trips_gp_idx").on(t.gpId)],
);

export const requests = pgTable(
  "requests",
  {
    id: serial("id").primaryKey(),
    tripId: integer("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    clientId: integer("client_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    weightKg: integer("weight_kg").notNull(),
    category: text("category").notNull(),
    description: text("description").notNull().default(""),
    pricePerKg: integer("price_per_kg").notNull(), // prix figé au moment de la demande
    status: requestStatusEnum("status").notNull().default("pending"),
    gpNote: text("gp_note").notNull().default(""),
    recipientName: text("recipient_name").notNull().default(""), // personne qui reçoit le colis à l'arrivée
    recipientPhone: text("recipient_phone").notNull().default(""), // format international
    deliveryCode: text("delivery_code"), // code à 6 chiffres, créé quand le GP accepte
    codeAttempts: integer("code_attempts").notNull().default(0), // essais de code ratés

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  },
  (t) => [index("requests_trip_idx").on(t.tripId), index("requests_client_idx").on(t.clientId)],
);

export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    requestId: integer("request_id")
      .notNull()
      .references(() => requests.id, { onDelete: "cascade" }),
    senderId: integer("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("messages_request_idx").on(t.requestId, t.id)],
);

export const reviews = pgTable(
  "reviews",
  {
    id: serial("id").primaryKey(),
    requestId: integer("request_id")
      .notNull()
      .references(() => requests.id, { onDelete: "cascade" }),
    gpId: integer("gp_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clientId: integer("client_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stars: smallint("stars").notNull(),
    comment: text("comment").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("reviews_request_idx").on(t.requestId), index("reviews_gp_idx").on(t.gpId)],
);

export const verificationDocs = pgTable("verification_docs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  filePath: text("file_path"), // supprimé après la décision de l'admin
  mimeType: text("mime_type").notNull(),
  status: docStatusEnum("status").notNull().default("pending"),
  adminNote: text("admin_note").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  reporterId: integer("reporter_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  tripId: integer("trip_id").references(() => trips.id, { onDelete: "set null" }),
  requestId: integer("request_id").references(() => requests.id, { onDelete: "set null" }),
  targetUserId: integer("target_user_id").references(() => users.id, { onDelete: "set null" }),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  urgent: boolean("urgent").notNull().default(false),
  status: reportStatusEnum("status").notNull().default("new"),
  adminReply: text("admin_reply").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Trip = typeof trips.$inferSelect;
export type Request = typeof requests.$inferSelect;

/** Fréquentation : une ligne par visiteur et par jour. Le visiteur est une empreinte anonyme
 *  (hachage de l'IP + navigateur + jour + secret serveur) : ni cookie ni IP stockés. */
export const siteVisits = pgTable(
  "site_visits",
  {
    day: date("day").notNull(),
    visitor: text("visitor").notNull(),
    views: integer("views").notNull().default(1),
  },
  (t) => [uniqueIndex("site_visits_day_visitor").on(t.day, t.visitor)],
);
