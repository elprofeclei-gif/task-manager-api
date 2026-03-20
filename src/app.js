import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import conectarDB from './config/db.js';
import env from './config/env.js';
import routes from './routes/index.js';
import { helmetMiddleware, limitadorGlobal } from './middlewares/seguridad.middleware.js';
import manejarErrores from './middlewares/error.middleware.js';

// Valida variables de entorno al arrancar — si falta alguna, el servidor no inicia
const { PORT, CLIENT_URL } = env;

// Conectar a la base de datos MongoDB
conectarDB();

const app = express();

// ─── Seguridad ────────────────────────────────────────────────────────────────
// Helmet protege cabeceras HTTP contra vulnerabilidades comunes
app.use(helmetMiddleware);

// Rate limit global: máx 100 peticiones por IP cada 15 minutos
app.use(limitadorGlobal);

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Solo se permiten peticiones desde el origen definido en CLIENT_URL
// Antes estaba abierto a todos los dominios con cors() sin opciones
app.use(cors({ origin: CLIENT_URL }));

// ─── Middlewares globales ─────────────────────────────────────────────────────
// Permite recibir JSON en el cuerpo de las peticiones
app.use(express.json());

// ─── Rutas ────────────────────────────────────────────────────────────────────
app.use('/api', routes);

// Ruta de prueba para verificar que el servidor está en línea
app.get('/', (req, res) => {
  res.json({ mensaje: '*** Task Manager API funcionando 🚀 ***' });
});

// ─── Manejo global de errores ─────────────────────────────────────────────────
// Debe registrarse siempre al final, después de todas las rutas
app.use(manejarErrores);

app.listen(PORT, () => {
  console.log(`*** 🚀 Servidor corriendo en http://localhost:${PORT} ***`);
});