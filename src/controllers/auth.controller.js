import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import {
  generarCodigo,
  enviarCodigoVerificacion,
  enviarCodigo2FA,
  enviarCodigoResetPassword,
} from '../services/email.service.js';

const generarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

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

    usuario = await User.create({
      nombre,
      email,
      password: passwordHash,
      verificationCode: codigo,
      verificationExpires: expiracion,
    });

    await enviarCodigoVerificacion(email, nombre, codigo);

    res.status(201).json({
      mensaje: 'Registro exitoso. Revisa tu correo e ingresa el código de verificación.',
    });
  } catch (error) {
    if (usuario) await User.findByIdAndDelete(usuario._id);
    next(error);
  }
};

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

    usuario.isVerified = true;
    usuario.verificationCode = null;
    usuario.verificationExpires = null;
    await usuario.save();

    res.json({ mensaje: 'Cuenta verificada correctamente. Ya puedes iniciar sesión.' });
  } catch (error) {
    next(error);
  }
};

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

    codigoAnterior = usuario.twoFactorCode;
    expiresAnterior = usuario.twoFactorExpires;

    const codigo = generarCodigo();
    usuario.twoFactorCode = codigo;
    usuario.twoFactorExpires = new Date(Date.now() + 10 * 60 * 1000);
    await usuario.save();

    await enviarCodigo2FA(email, usuario.nombre, codigo);

    res.json({
      mensaje: 'Credenciales correctas. Revisa tu correo e ingresa el código de acceso.',
    });
  } catch (error) {
    if (usuario && error.status !== 401) {
      usuario.twoFactorCode = codigoAnterior;
      usuario.twoFactorExpires = expiresAnterior;
      await usuario.save();
    }
    next(error);
  }
};

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

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const usuario = await User.findOne({ email });

    if (!usuario) {
      return res.json({
        mensaje: 'Si el correo existe, recibirás un código para restablecer tu contraseña.',
      });
    }

    const codigoAnterior = usuario.resetPasswordToken;
    const expiresAnterior = usuario.resetPasswordExpires;

    const codigo = generarCodigo();
    usuario.resetPasswordToken = codigo;
    usuario.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await usuario.save();

    try {
      await enviarCodigoResetPassword(email, usuario.nombre, codigo);
    } catch (emailError) {
      usuario.resetPasswordToken = codigoAnterior;
      usuario.resetPasswordExpires = expiresAnterior;
      await usuario.save();
      throw emailError;
    }

    res.json({
      mensaje: 'Si el correo existe, recibirás un código para restablecer tu contraseña.',
    });
  } catch (error) {
    next(error);
  }
};

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