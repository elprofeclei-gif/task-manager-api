import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Verifica el token JWT enviado en el header Authorization
 * Agrega el usuario autenticado en req.usuario
 */
const protegerRuta = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ mensaje: '*** No autorizado, token requerido ***' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Adjuntar usuario al request (sin la contraseña)
    req.usuario = await User.findById(decoded.id).select('-password');

    next();
  } catch (error) {
    res.status(401).json({ mensaje: '*** Token inválido o expirado ***' });
  }
};

export default protegerRuta;