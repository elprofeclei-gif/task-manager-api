import Joi from 'joi';

export const schemaRegister = Joi.object({
  nombre: Joi.string().min(2).max(50).required().messages({
    'string.min': 'El nombre debe tener mínimo 2 caracteres',
    'any.required': 'El nombre es obligatorio',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'El email no es válido',
    'any.required': 'El email es obligatorio',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'La contraseña debe tener mínimo 6 caracteres',
    'any.required': 'La contraseña es obligatoria',
  }),
});

export const schemaLogin = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'El email no es válido',
    'any.required': 'El email es obligatorio',
  }),
  password: Joi.string().required().messages({
    'any.required': 'La contraseña es obligatoria',
  }),
});

// Schema para verificar código (registro y 2FA)
export const schemaCodigo = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'El email no es válido',
    'any.required': 'El email es obligatorio',
  }),
  codigo: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    'string.length': 'El código debe tener 6 dígitos',
    'string.pattern.base': 'El código solo debe contener números',
    'any.required': 'El código es obligatorio',
  }),
});

export const schemaForgotPassword = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'El email no es válido',
    'any.required': 'El email es obligatorio',
  }),
});

export const schemaResetPassword = Joi.object({
  email: Joi.string().email().required().messages({
    'any.required': 'El email es obligatorio',
  }),
  codigo: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    'string.length': 'El código debe tener 6 dígitos',
    'any.required': 'El código es obligatorio',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'La contraseña debe tener mínimo 6 caracteres',
    'any.required': 'La contraseña es obligatoria',
  }),
});