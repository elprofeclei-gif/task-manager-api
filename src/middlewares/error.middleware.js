/**
 * Middleware global de manejo de errores.
 * Captura cualquier error lanzado con next(error) en los controladores.
 */
const manejarErrores = (err, req, res, next) => {
  const status = err.status || 500;
  const mensaje = err.message || '*** Error interno del servidor ***';

  // Error de ID inválido de MongoDB
  if (err.name === 'CastError') {
    return res.status(400).json({ mensaje: '*** ID inválido ***' });
  }

  // Error de campo único duplicado (ej: email repetido)
  if (err.code === 11000) {
    const campo = Object.keys(err.keyValue)[0];
    return res.status(400).json({ mensaje: `*** El ${campo} ya está registrado ***` });
  }

  // Error de validación de Mongoose
  if (err.name === 'ValidationError') {
    const mensajes = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ mensaje: mensajes.join(', ') });
  }

  res.status(status).json({ mensaje });
};

export default manejarErrores;