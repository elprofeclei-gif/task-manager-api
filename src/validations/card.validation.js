import Joi from 'joi';

export const schemaCard = Joi.object({
  titulo: Joi.string().min(2).max(100).required().messages({
    'string.min': 'El título debe tener mínimo 2 caracteres',
    'any.required': 'El título es obligatorio',
  }),
  descripcion: Joi.string().max(500).allow('').optional(),
  orden: Joi.number().optional(),
  prioridad: Joi.string().valid('baja', 'media', 'alta').optional().messages({
    'any.only': 'La prioridad debe ser baja, media o alta',
  }),
  fechaLimite: Joi.date().iso().allow(null).optional().messages({
    'date.format': 'La fecha debe estar en formato ISO (YYYY-MM-DD)',
  }),
});

export const schemaMoverCard = Joi.object({
  columnaDestino: Joi.string().required().messages({
    'any.required': 'La columna destino es obligatoria',
  }),
  orden: Joi.number().required().messages({
    'any.required': 'El orden es obligatorio',
  }),
});