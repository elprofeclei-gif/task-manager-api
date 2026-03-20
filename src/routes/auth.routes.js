import { Router } from 'express';
import {
  register,
  verificarEmail,
  login,
  verificar2FA,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller.js';
import { limitadorAuth } from '../middlewares/seguridad.middleware.js';
import validar from '../middlewares/validar.middleware.js';
import {
  schemaRegister,
  schemaLogin,
  schemaCodigo,
  schemaForgotPassword,
  schemaResetPassword,
} from '../validations/auth.validation.js';

const router = Router();

/**
 * POST /api/auth/register
 * Crea una cuenta nueva y envía un código de verificación al correo.
 * Protegido con rate limit para prevenir registros masivos automatizados.
 */
router.post('/register', limitadorAuth, validar(schemaRegister), register);

/**
 * POST /api/auth/verify-email
 * Verifica la cuenta con el código recibido por correo.
 * Protegido con rate limit para prevenir fuerza bruta sobre el código de 6 dígitos
 * (900.000 combinaciones posibles sin restricción serían vulnerables).
 */
router.post('/verify-email', limitadorAuth, validar(schemaCodigo), verificarEmail);

/**
 * POST /api/auth/login
 * Valida credenciales y envía un código 2FA al correo.
 * Protegido con rate limit para prevenir ataques de fuerza bruta.
 */
router.post('/login', limitadorAuth, validar(schemaLogin), login);

/**
 * POST /api/auth/verify-2fa
 * Verifica el código 2FA y devuelve el JWT de sesión.
 * Protegido con rate limit — sin este límite el código 2FA sería brute-forceable.
 */
router.post('/verify-2fa', limitadorAuth, validar(schemaCodigo), verificar2FA);

/**
 * POST /api/auth/forgot-password
 * Envía un código de recuperación al correo si el email existe.
 * Protegido con rate limit para prevenir enumeración de usuarios y spam.
 */
router.post('/forgot-password', limitadorAuth, validar(schemaForgotPassword), forgotPassword);

/**
 * POST /api/auth/reset-password
 * Restablece la contraseña usando el código de recuperación recibido.
 * Protegido con rate limit — sin este límite el código sería brute-forceable.
 */
router.post('/reset-password', limitadorAuth, validar(schemaResetPassword), resetPassword);

export default router;