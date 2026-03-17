import { Router } from 'express';
import {
  obtenerColumnas,
  crearColumna,
  actualizarColumna,
  eliminarColumna,
} from '../controllers/column.controller.js';
import protegerRuta from '../middlewares/auth.middleware.js';
import validar from '../middlewares/validar.middleware.js';
import { schemaColumna } from '../validations/column.validation.js';
import cardRoutes from './card.routes.js';

const router = Router({ mergeParams: true });

router.use(protegerRuta);

// Delegar rutas de cards al router de cards
router.use('/:columnId/cards', cardRoutes);

router.route('/')
  .get(obtenerColumnas)
  .post(validar(schemaColumna), crearColumna);

router.route('/:id')
  .put(validar(schemaColumna), actualizarColumna)
  .delete(eliminarColumna);

export default router;