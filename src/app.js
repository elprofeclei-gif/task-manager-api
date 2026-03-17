import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import conectarDB from './config/db.js';
import env from './config/env.js';
import routes from './routes/index.js';
import { helmetMiddleware, limitadorGlobal } from './middlewares/seguridad.middleware.js';
import manejarErrores from './middlewares/error.middleware.js';

// Valida variables de entorno al arrancar
const { PORT } = env;



// Conectar a la base de datos
conectarDB();

const app = express();


// Seguridad
app.use(helmetMiddleware);
app.use(limitadorGlobal);

// Middlewares globales
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api', routes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ mensaje: '*** Task Manager API funcionando 🚀 ***' });
});

// Debe ir siempre al final
app.use(manejarErrores);

app.listen(PORT, () => {
  console.log(`*** 🚀 Servidor corriendo en http://localhost:${PORT} ***`);
});