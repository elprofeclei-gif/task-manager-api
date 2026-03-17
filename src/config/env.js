import { cleanEnv, str, port } from 'envalid';

/**
 * Valida que todas las variables de entorno requeridas estén definidas.
 * Si falta alguna, el servidor no arranca y muestra cuál falta.
 */
const env = cleanEnv(process.env, {
  PORT: port({ default: 3000 }),
  MONGO_URI: str(),
  JWT_SECRET: str(),
  EMAIL_USER: str(),
  EMAIL_PASS: str(),
  CLIENT_URL: str(),
});

export default env;