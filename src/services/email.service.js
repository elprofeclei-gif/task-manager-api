import nodemailer from 'nodemailer';
import env from '../config/env.js';

const transporter = nodemailer.createTransport({
  host: 'sandbox.smtp.mailtrap.io',
  port: 2525,
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 5000,
});

/**
 * Genera un código numérico aleatorio de 6 dígitos
 */
export const generarCodigo = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Intenta enviar el email. Si falla, muestra el código en consola (modo desarrollo)
 */
const enviarEmail = async (opciones) => {
  try {
    await transporter.sendMail(opciones);
  } catch (error) {
    // En desarrollo mostramos el código en consola si el email falla
    console.log('-----------------------------------');
    console.log('📧 EMAIL NO ENVIADO (modo dev)');
    console.log(`📬 Para: ${opciones.to}`);
    console.log(`📋 Asunto: ${opciones.subject}`);
    console.log(`🔑 Código: ${opciones.html.match(/\d{6}/)[0]}`);
    console.log('-----------------------------------');
  }
};

export const enviarCodigoVerificacion = async (email, nombre, codigo) => {
  await enviarEmail({
    from: `"Task Manager" <${env.EMAIL_USER}>`,
    to: email,
    subject: 'Código de verificación',
    html: `<p>Hola ${nombre}, tu código es:</p><h1>${codigo}</h1><p>Expira en 15 minutos.</p>`,
  });
};

export const enviarCodigo2FA = async (email, nombre, codigo) => {
  await enviarEmail({
    from: `"Task Manager" <${env.EMAIL_USER}>`,
    to: email,
    subject: 'Código de acceso',
    html: `<p>Hola ${nombre}, tu código 2FA es:</p><h1>${codigo}</h1><p>Expira en 10 minutos.</p>`,
  });
};

export const enviarCodigoResetPassword = async (email, nombre, codigo) => {
  await enviarEmail({
    from: `"Task Manager" <${env.EMAIL_USER}>`,
    to: email,
    subject: 'Código para restablecer contraseña',
    html: `<p>Hola ${nombre}, tu código es:</p><h1>${codigo}</h1><p>Expira en 1 hora.</p>`,
  });
};