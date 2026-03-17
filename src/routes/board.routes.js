import { Router } from 'express';
import {
  obtenerBoards,
  crearBoard,
  obtenerBoardPorId,
  actualizarBoard,
  eliminarBoard,
} from '../controllers/board.controller.js';
import protegerRuta from '../middlewares/auth.middleware.js';
import validar from '../middlewares/validar.middleware.js';
import { schemaBoard } from '../validations/board.validation.js';

const router = Router();

// Todas las rutas de boards requieren autenticación
router.use(protegerRuta);

router.route('/')
  .get(obtenerBoards)
  .post(validar(schemaBoard), crearBoard);

router.route('/:id')
  .get(obtenerBoardPorId)
  .put(validar(schemaBoard), actualizarBoard)
  .delete(eliminarBoard);

export default router;