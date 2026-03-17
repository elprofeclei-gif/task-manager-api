import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

/**
 * Protege headers HTTP contra vulnerabilidades comunes
 */
export const helmetMiddleware = helmet();

/**
 * Limita peticiones globales: máx 100 por IP cada 15 minutos
 */
export const limitadorGlobal = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { mensaje: 'Demasiadas peticiones, intenta más tarde' },
});

/**
 * Limita intentos de login: máx 10 por IP cada 15 minutos
 * Previene ataques de fuerza bruta
 */
export const limitadorAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { mensaje: 'Demasiados intentos, intenta más tarde' },
});