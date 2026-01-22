import { mysqlTable, mysqlSchema, AnyMySqlColumn, primaryKey, int, varchar, index, foreignKey, text, json, timestamp, bigint, tinyint } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const config = mysqlTable("config", {
	id: int().autoincrement().notNull(),
	key: varchar({ length: 255 }),
	value: varchar({ length: 255 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "config_id"}),
]);

export const dataSources = mysqlTable("data_sources", {
	id: int().autoincrement().notNull(),
	platform: varchar({ length: 255 }),
	identifier: varchar({ length: 255 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "data_sources_id"}),
]);

export const templateCategories = mysqlTable("template_categories", {
	id: int().autoincrement().notNull(),
	templateId: int("template_id").notNull().references(() => templates.id, { onDelete: "cascade" } ),
	category: varchar({ length: 50 }).notNull(),
},
(table) => [
	index("idx_template_id").on(table.templateId),
	primaryKey({ columns: [table.id], name: "template_categories_id"}),
]);

export const templateVersions = mysqlTable("template_versions", {
	id: int().autoincrement().notNull(),
	templateId: int("template_id").notNull().references(() => templates.id, { onDelete: "cascade" } ),
	version: varchar({ length: 20 }).notNull(),
	content: text().notNull(),
	schema: json(),
	changes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	createdBy: int("created_by"),
},
(table) => [
	index("idx_template_id").on(table.templateId),
	primaryKey({ columns: [table.id], name: "template_versions_id"}),
]);

export const templates = mysqlTable("templates", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	platform: varchar({ length: 50 }).notNull(),
	style: varchar({ length: 50 }).notNull(),
	content: text().notNull(),
	schema: json(),
	exampleData: json("example_data"),
	isActive: tinyint("is_active").default(1),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	createdBy: int("created_by"),
},
(table) => [
	primaryKey({ columns: [table.id], name: "templates_id"}),
]);

export const vectorItems = mysqlTable("vector_items", {
	id: bigint({ mode: "number" }).notNull(),
	content: text(),
	vector: json(),
	vectorDim: int("vector_dim"),
	vectorType: varchar("vector_type", { length: 20 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "vector_items_id"}),
]);
