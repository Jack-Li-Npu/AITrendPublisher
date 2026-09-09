import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { config, dataSources, vectorItems } from "@src/db/schema.ts";
import { Logger } from "@zilla/logger";

// 使用 Deno.env（配合 deno run --env 自动加载 .env 文件）

const logger = new Logger("DB");

logger.info("DB_HOST", Deno.env.get("DB_HOST"));
logger.info("DB_PORT", Deno.env.get("DB_PORT"));
logger.info("DB_USER", Deno.env.get("DB_USER"));
logger.info("DB_DATABASE", Deno.env.get("DB_DATABASE"));

const poolConnection = mysql.createPool({
  host: Deno.env.get("DB_HOST"),
  port: Number(Deno.env.get("DB_PORT")),
  user: Deno.env.get("DB_USER"),
  password: Deno.env.get("DB_PASSWORD"),
  database: Deno.env.get("DB_DATABASE"),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

const db = drizzle(poolConnection, {
  mode: "default",
  schema: {
    config: config,
    dataSources: dataSources,
    vectorItems
  },
});

export default db;
