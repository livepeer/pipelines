"use strict";
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }
    : function (o, v) {
        o["default"] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o)
            if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== "default") __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.withDbClient = exports.getDbClient = exports.db = void 0;
const postgres_js_1 = require("drizzle-orm/postgres-js");
const postgres_1 = __importDefault(require("postgres"));
const schema = __importStar(require("./schema"));
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}
const connectionString = process.env.DATABASE_URL;
const client = (0, postgres_1.default)(connectionString);
exports.db = (0, postgres_js_1.drizzle)(client, { schema });
// For transactions or one-time queries that need to be cleaned up
const getDbClient = () => {
  const client = (0, postgres_1.default)(connectionString);
  return (0, postgres_js_1.drizzle)(client, { schema });
};
exports.getDbClient = getDbClient;
// Helper for running with a client then closing connection
const withDbClient = async fn => {
  const client = (0, postgres_1.default)(connectionString);
  const db = (0, postgres_js_1.drizzle)(client, { schema });
  try {
    return await fn(db);
  } finally {
    await client.end();
  }
};
exports.withDbClient = withDbClient;
