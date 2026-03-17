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

router.post('/register', limitadorAuth, validar(schemaRegister), register);
router.post('/verify-email', validar(schemaCodigo), verificarEmail);
router.post('/login', limitadorAuth, validar(schemaLogin), login);
router.post('/verify-2fa', validar(schemaCodigo), verificar2FA);
router.post('/forgot-password', limitadorAuth, validar(schemaForgotPassword), forgotPassword);
router.post('/reset-password', validar(schemaResetPassword), resetPassword);

export default router;