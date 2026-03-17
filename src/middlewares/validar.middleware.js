/**
 * Middleware genérico de validación con Joi.
 * Recibe un schema y valida req.body antes de pasar al controlador.
 */
const validar = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const mensajes = error.details.map((d) => d.message).join(', ');
    return res.status(400).json({ mensaje: mensajes });
  }
  next();
};

export default validar;