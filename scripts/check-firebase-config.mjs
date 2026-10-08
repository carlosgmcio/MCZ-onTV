import nextEnv from "@next/env";

// Use the same environment loader as Next.js. Never log configuration values.
nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

const required = ["API_KEY", "AUTH_DOMAIN", "PROJECT_ID", "APP_ID"];
const missing = required
  .map((key) => `NEXT_PUBLIC_FIREBASE_${key}`)
  .filter((key) => !process.env[key]?.trim());

if (missing.length) {
  console.error("Configuração Firebase Web incompleta. Variáveis ausentes ou vazias:");
  for (const key of missing) console.error(`- ${key}`);
  console.error("Preencha os valores do aplicativo Web existente e reinicie o Next.js (ou refaça o build).");
  process.exitCode = 1;
} else {
  console.log("Configuração Firebase Web presente. Nenhum valor foi exibido.");
  console.log("A validação do provedor Google e dos domínios exige um login real.");
}
