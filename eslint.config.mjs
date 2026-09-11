import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores([
    // Next.js generated files
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",

    // Prisma-generated contract declarations
    "src/prisma/contract.d.ts",

    // Prisma-generated migration snapshots
    "migrations/snapshots/**",
  ]),
]);

export default eslintConfig;
