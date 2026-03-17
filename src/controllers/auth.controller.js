import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import {
  generarCodigo,
  enviarCodigoVerificacion,
  enviarCodigo2FA,
  enviarCodigoResetPassword,
} from '../services/email.service.js';

/**
 * Genera un JWT con el id del usuario
 */
const generarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

/**
 * POST /api/auth/register
 * Registra usuario y envía código de verificación al correo
 */
export const register = async (req, res, next) => {
  let usuario = null;
  try {
    const { nombre, email, password } = req.body;

    const usuarioExiste = await User.findOne({ email });
    if (usuarioExiste) {
      const err = new Error('El email ya está registrado');
      err.status = 400;
      throw err;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const codigo = generarCodigo();
    const expiracion = new Date(Date.now() + 15 * 60 * 1000);

    // Crear usuario en DB
    usuario = await User.create({
      nombre,
      email,
      password: passwordHash,
      verificationCode: codigo,
      verificationExpires: expiracion,
    });

    // Intentar enviar email — si falla, elimina el usuario
    await enviarCodigoVerificacion(email, nombre, codigo);

    res.status(201).json({
      mensaje: 'Registro exitoso. Revisa tu correo e ingresa el código de verificación.',
    });
  } catch (error) {
    // Revertir: eliminar usuario si el email falló
    if (usuario) await User.findByIdAndDelete(usuario._id);
    next(error);
  }
};

/**
 * POST /api/auth/verify-email
 * Verifica la cuenta con el código enviado al correo
 */
export const verificarEmail = async (req, res, next) => {
  try {
    const { email, codigo } = req.body;

    const usuario = await User.findOne({
      email,
      verificationCode: codigo,
      verificationExpires: { $gt: Date.now() },
    });

    if (!usuario) {
      const err = new Error('Código inválido o expirado');
      err.status = 400;
      throw err;
    }

    // Activar cuenta y limpiar código
    usuario.isVerified = true;
    usuario.verificationCode = null;
    usuario.verificationExpires = null;
    await usuario.save();

    res.json({ mensaje: 'Cuenta verificada correctamente. Ya puedes iniciar sesión.' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Valida credenciales y envía código 2FA al correo
 */
export const login = async (req, res, next) => {
  let codigoAnterior = null;
  let expiresAnterior = null;
  let usuario = null;

  try {
    const { email, password } = req.body;

    usuario = await User.findOne({ email });
    if (!usuario) {
      const err = new Error('Credenciales inválidas');
      err.status = 401;
      throw err;
    }

    if (!usuario.isVerified) {
      const err = new Error('Debes verificar tu correo antes de iniciar sesión');
      err.status = 401;
      throw err;
    }

    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) {
      const err = new Error('Credenciales inválidas');
      err.status = 401;
      throw err;
    }

    // Guardar estado anterior por si hay que revertir
    codigoAnterior = usuario.twoFactorCode;
    expiresAnterior = usuario.twoFactorExpires;

    const codigo = generarCodigo();
    usuario.twoFactorCode = codigo;
    usuario.twoFactorExpires = new Date(Date.now() + 10 * 60 * 1000);
    await usuario.save();

    // Intentar enviar email — si falla, revertir el código en DB
    await enviarCodigo2FA(email, usuario.nombre, codigo);

    res.json({
      mensaje: 'Credenciales correctas. Revisa tu correo e ingresa el código de acceso.',
    });
  } catch (error) {
    // Revertir código 2FA si el email falló
    if (usuario && error.message !== 'Credenciales inválidas') {
      usuario.twoFactorCode = codigoAnterior;
      usuario.twoFactorExpires = expiresAnterior;
      await usuario.save();
    }
    next(error);
  }
};
/**
 * POST /api/auth/verify-2fa
 * Verifica el código 2FA y devuelve el JWT
 */
export const verificar2FA = async (req, res, next) => {
  try {
    const { email, codigo } = req.body;

    const usuario = await User.findOne({
      email,
      twoFactorCode: codigo,
      twoFactorExpires: { $gt: Date.now() },
    });

    if (!usuario) {
      const err = new Error('Código inválido o expirado');
      err.status = 400;
      throw err;
    }

    // Limpiar código 2FA y devolver JWT
    usuario.twoFactorCode = null;
    usuario.twoFactorExpires = null;
    await usuario.save();

    res.json({
      _id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      token: generarToken(usuario._id),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/forgot-password
 * Envía código para restablecer contraseña
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const usuario = await User.findOne({ email });

    // Respuesta genérica para no revelar si el email existe
    if (!usuario) {
      return res.json({
        mensaje: 'Si el correo existe, recibirás un código para restablecer tu contraseña.',
      });
    }

    const codigo = generarCodigo();
    usuario.resetPasswordToken = codigo;
    usuario.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await usuario.save();

    await enviarCodigoResetPassword(email, usuario.nombre, codigo);

    res.json({
      mensaje: 'Si el correo existe, recibirás un código para restablecer tu contraseña.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/reset-password
 * Restablece la contraseña con el código recibido
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { email, codigo, password } = req.body;

    const usuario = await User.findOne({
      email,
      resetPasswordToken: codigo,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!usuario) {
      const err = new Error('Código inválido o expirado');
      err.status = 400;
      throw err;
    }

    const salt = await bcrypt.genSalt(10);
    usuario.password = await bcrypt.hash(password, salt);
    usuario.resetPasswordToken = null;
    usuario.resetPasswordExpires = null;
    await usuario.save();

    res.json({ mensaje: 'Contraseña restablecida correctamente. Ya puedes iniciar sesión.' });
  } catch (error) {
    next(error);
  }
};