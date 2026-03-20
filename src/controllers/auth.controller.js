import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import {
  generarCodigo,
  enviarCodigoVerificacion,
  enviarCodigo2FA,
  enviarCodigoResetPassword,
} from '../services/email.service.js';

/**
 * Genera un JWT firmado con el ID del usuario.
 * Expira en 7 días.
 * @param {string} id - ID del usuario en MongoDB
 * @returns {string} Token JWT
 */
const generarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

/**
 * POST /api/auth/register
 * Registra un nuevo usuario y envía un código de verificación al correo.
 *
 * Flujo:
 * 1. Verifica que el email no esté ya registrado.
 * 2. Hashea la contraseña con bcrypt.
 * 3. Crea el usuario en la base de datos.
 * 4. Intenta enviar el email — si falla, elimina el usuario (rollback)
 *    para no dejar cuentas huérfanas sin verificar.
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
    const expiracion = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    usuario = await User.create({
      nombre,
      email,
      password: passwordHash,
      verificationCode: codigo,
      verificationExpires: expiracion,
    });

    // Si el envío de email falla, el servicio relanza el error
    // y el catch elimina el usuario recién creado
    await enviarCodigoVerificacion(email, nombre, codigo);

    res.status(201).json({
      mensaje: 'Registro exitoso. Revisa tu correo e ingresa el código de verificación.',
    });
  } catch (error) {
    // Rollback: elimina el usuario si el email no pudo enviarse
    if (usuario) await User.findByIdAndDelete(usuario._id);
    next(error);
  }
};

/**
 * POST /api/auth/verify-email
 * Activa la cuenta del usuario con el código recibido por correo.
 *
 * El código tiene una expiración de 15 minutos.
 * Una vez verificado, se limpia el código de la base de datos.
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

    // Activar cuenta y limpiar campos de verificación
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
 * Valida credenciales y envía un código 2FA al correo del usuario.
 *
 * Flujo:
 * 1. Busca el usuario por email.
 * 2. Verifica que la cuenta esté activada.
 * 3. Compara la contraseña con bcrypt.
 * 4. Guarda un nuevo código 2FA en la base de datos.
 * 5. Intenta enviar el código por email.
 *
 * Rollback:
 * Se usa el flag `modificado` para saber con certeza si el código fue
 * guardado en BD antes de que ocurra un error. Solo en ese caso se revierte
 * al código anterior, evitando rollbacks innecesarios si el error ocurrió
 * antes del save() (ej: error de BD, credenciales inválidas).
 */
export const login = async (req, res, next) => {
  let codigoAnterior = null;
  let expiresAnterior = null;
  let usuario = null;
  let modificado = false; // flag: indica si el código 2FA fue guardado en BD

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
    usuario.twoFactorExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos
    await usuario.save();

    // A partir de aquí el código está en BD — activamos el flag de rollback
    modificado = true;

    await enviarCodigo2FA(email, usuario.nombre, codigo);

    res.json({
      mensaje: 'Credenciales correctas. Revisa tu correo e ingresa el código de acceso.',
    });
  } catch (error) {
    // Rollback: solo revertir si el código fue efectivamente guardado en BD
    if (usuario && modificado) {
      usuario.twoFactorCode = codigoAnterior;
      usuario.twoFactorExpires = expiresAnterior;
      await usuario.save();
    }
    next(error);
  }
};

/**
 * POST /api/auth/verify-2fa
 * Verifica el código 2FA y devuelve el JWT de sesión.
 *
 * Una vez verificado, se limpia el código de la base de datos
 * para que no pueda reutilizarse.
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

    // Limpiar el código 2FA para evitar reutilización
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
 * Genera y envía un código para restablecer la contraseña.
 *
 * La respuesta es siempre la misma, exista o no el email,
 * para no revelar qué correos están registrados en el sistema.
 *
 * Rollback:
 * Si el email falla, se restaura el token anterior en la base de datos
 * para no invalidar un token de recuperación que el usuario ya tenía.
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const usuario = await User.findOne({ email });

    // Respuesta genérica para no revelar si el email existe (enumeración de usuarios)
    if (!usuario) {
      return res.json({
        mensaje: 'Si el correo existe, recibirás un código para restablecer tu contraseña.',
      });
    }

    // Guardar estado anterior por si hay que revertir
    const codigoAnterior = usuario.resetPasswordToken;
    const expiresAnterior = usuario.resetPasswordExpires;

    const codigo = generarCodigo();
    usuario.resetPasswordToken = codigo;
    usuario.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
    await usuario.save();

    try {
      await enviarCodigoResetPassword(email, usuario.nombre, codigo);
    } catch (emailError) {
      // Rollback: restaurar token anterior si el email no pudo enviarse
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

/**
 * POST /api/auth/reset-password
 * Restablece la contraseña del usuario usando el código de recuperación.
 *
 * Una vez usada, se limpia el token para que no pueda reutilizarse.
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

    // Limpiar el token para evitar reutilización
    usuario.resetPasswordToken = null;
    usuario.resetPasswordExpires = null;
    await usuario.save();

    res.json({ mensaje: 'Contraseña restablecida correctamente. Ya puedes iniciar sesión.' });
  } catch (error) {
    next(error);
  }
};