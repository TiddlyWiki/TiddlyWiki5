import prisma from "@prisma/client";


// const utils = require("@prisma/driver-adapter-utils");
import { Database } from "node-sqlite3-wasm";
import { readFileSync } from "fs";
const db = new Database(":memory:", {});
console.log(db.exec(readFileSync("./schema.prisma.sql", "utf-8")));
console.log(db.run(`
  
  -- CreateTable
CREATE TABLE "everything" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "String" TEXT NOT NULL,
    "Boolean" BOOLEAN NOT NULL,
    "Int" INTEGER NOT NULL,
    "BigInt" BIGINT NOT NULL,
    "Float" REAL NOT NULL,
    "Decimal" DECIMAL NOT NULL,
    "DateTime" DATETIME NOT NULL,
    "Json" JSONB NOT NULL,
    "Bytes" BLOB NOT NULL,
    "Enum" TEXT NOT NULL
);

`))
console.log(db.all("select * from 'everything';"));
const query = {
  sql: 'INSERT INTO `users` (`username`, `email`, `password`, `created_at`) VALUES (?,?,?,?) RETURNING `user_id` AS `user_id`, `username` AS `username`, `email` AS `email`, `password` AS `password`, `created_at` AS `created_at`, `last_login` AS `last_login`',
  args: [Date.now().toString(), Date.now().toString(), Date.now().toString(), "datetime('now')"],
  argTypes: ['Text', 'Text', 'Text', 'Text']
};
enum ColumnType {
  INTEGER = 1,
  FLOAT = 2,
  TEXT = 3,
  BLOB = 4,
  NULL = 5,
}
// String	TEXT
// Boolean	BOOLEAN
// Int	INTEGER
// BigInt	INTEGER
// Float	REAL
// Decimal	DECIMAL
// DateTime	NUMERIC
// Json	JSONB
// Bytes	BLOB
// Enum	TEXT
const stmt = db.prepare(query.sql);
// console.log(stmt._getColumnNames());
// console.log(stmt._getColumnTypes().map((type) => ColumnType[type]));

console.log(ColumnType);
console.log(stmt.all(query.args));

class Result_4<S extends boolean, T> {
  ok: S;
  value: T;
  constructor(ok: S, value: T) {
    this.ok = ok;
    this.value = value;
  }
  map<U>(fn: (value: T) => U): Result_4<S, U> {
    return new Result_4(this.ok, fn(this.value));
  }
  flatMap<U>(fn: (value: T) => Result_4<S, U>): Result_4<S, U> {
    return fn(this.value);
  }
}
const t = {
  sql: 'INSERT INTO `main`.`everything` (`id`, `String`, `Boolean`, `Int`, `BigInt`, `Float`, `Decimal`, `DateTime`, `Json`, `Bytes`, `Enum`) VALUES (?,?,?,?,?,?,?,?,?,?,?) RETURNING `id` AS `id`, `String` AS `String`, `Boolean` AS `Boolean`, `Int` AS `Int`, `BigInt` AS `BigInt`, `Float` AS `Float`, `Decimal` AS `Decimal`, `DateTime` AS `DateTime`, `Json` AS `Json`, `Bytes` AS `Bytes`, `Enum` AS `Enum`',
  args: [
    1736630219114,
    'test',
    true,
    1,
    1,
    1.1,
    1.1,
    '2025-01-11T21:16:59.114+00:00',
    '{"test":1}',
    Uint8Array.from([ 1, 2, 3 ]) ,
    'test'
  ],
  argTypes: [
    'Int64',  
    'Text',
    'Boolean',
    'Int64',
    'Int64',  
    'Numeric',
    'Numeric',
    'DateTime',
    'Json',   
    'Bytes',
    'Enum'
  ]
};

const client = new prisma.PrismaClient({
  adapter: {
    adapterName: "sqlite",
    provider: "sqlite",
    executeRaw: async (query) => {

    },
    queryRaw: async (query) => {
      console.log(query);
      const argTypeMap: Record<typeof query.argTypes[number], ColumnType> = {
        Array: ColumnType.BLOB,
        Boolean: ColumnType.INTEGER,
        Date: ColumnType.INTEGER,
        Bytes: ColumnType.BLOB,
        Char: ColumnType.TEXT,
        DateTime: ColumnType.INTEGER,
        Double: ColumnType.FLOAT,
        Float: ColumnType.FLOAT,
        Enum: ColumnType.TEXT,
        EnumArray: ColumnType.BLOB,
        Int32: ColumnType.INTEGER,
        Int64: ColumnType.INTEGER,
        Json: ColumnType.TEXT,
        Numeric: ColumnType.FLOAT,
        Text: ColumnType.TEXT,
        Time: ColumnType.INTEGER,
        Uuid: ColumnType.TEXT,
        Xml: ColumnType.TEXT,
      }
      const rows = db.prepare(query.sql).all(query.args as any[]);
      // console.log(stmt._getColumnNames());
      const columnNames = rows.length > 0 ? Object.keys(rows[0]) : [];
      const columnTypes = rows.length > 0 ? Object.values(rows[0]).map((value) => {
        if (typeof value === "bigint" || typeof value === "number" && Number.isInteger(value)) {
          return ColumnType.INTEGER;
        } else if (typeof value === "number") {
          return ColumnType.FLOAT;
        } else if (typeof value === "string") {
          return ColumnType.TEXT;
        } else if (value instanceof Uint8Array) {
          return ColumnType.BLOB;
        } else if(value == null) {
          return ColumnType.NULL;
        } else {
          console.log(value, typeof value);
        }
      }) : [];

      const lastInsertId = db.prepare("SELECT last_insert_rowid() insert_id;").get()?.insert_id ?? 0;
      return new Result_4(true, { columnNames, columnTypes, rows, lastInsertId });
    },
    transactionContext: async (callback) => {
      throw "";
      return callback();
    }
  }
});

Promise.resolve().then(async () => {
  
  await client.everything.create({
    data: {
      BigInt: BigInt(1),
      Boolean: true,
      Bytes: new Uint8Array([1, 2, 3]),
      DateTime: new Date(),
      Decimal: 1.1,
      Enum: "test",
      Float: 1.1,
      Int: 1,
      Json: { test: 1 },
      String: "test",
      id: Date.now()
    }
  });
});

process.on("unhandledException", (err) => {
  console.log(err);
  process.exit(1);
});