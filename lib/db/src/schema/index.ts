import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const storeSettings = pgTable("store_settings", {
  id: serial("id").primaryKey(),
  tillNumber: text("till_number").notNull().default("6950412"),
  customerCare: text("customer_care").notNull().default("0769252572"),
  contactName: text("contact_name").notNull().default("EDWIN ONDERI"),
  mpesaPasskey: text("mpesa_passkey"),
  mpesaConsumerSecret: text("mpesa_consumer_secret"),
  mpesaShortcode: text("mpesa_shortcode"),
  mpesaConsumerKey: text("mpesa_consumer_key"),
  mpesaPartyB: text("mpesa_party_b"),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  phoneNumber: text("phone_number").notNull(),
  dealId: text("deal_id").notNull(),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("pending"),
  mpesaReceipt: text("mpesa_receipt"),
  failureReason: text("failure_reason"),
  checkoutRequestId: text("checkout_request_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  phoneNumber: text("phone_number").notNull().unique(),
  name: text("name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const deals = pgTable("deals", {
  id: text("id").primaryKey(),
  category: text("category").notNull(),
  price: integer("price").notNull(),
  quantity: text("quantity").notNull(),
  validity: text("validity").notNull(),
  repeatable: boolean("repeatable").notNull().default(false),
});

export type Order = typeof orders.$inferSelect;
export type Customer = typeof customers.$inferSelect;