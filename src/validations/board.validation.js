import Joi from 'joi';

export const schemaBoard = Joi.object({
  nombre: Joi.string().min(2).max(100).required().messages({
    'string.min': 'El nombre debe tener mínimo 2 caracteres',
    'any.required': 'El nombre es obligatorio',
  }),
  descripcion: Joi.string().max(300).allow('').optional(),
});