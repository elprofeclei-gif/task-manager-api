import { Router } from 'express';
import {
  obtenerCards,
  crearCard,
  actualizarCard,
  moverCard,
  eliminarCard,
} from '../controllers/card.controller.js';
import protegerRuta from '../middlewares/auth.middleware.js';
import validar from '../middlewares/validar.middleware.js';
import { schemaCard, schemaMoverCard } from '../validations/card.validation.js';

const router = Router({ mergeParams: true });

router.use(protegerRuta);

router.route('/')
  .get(obtenerCards)
  .post(validar(schemaCard), crearCard);

router.route('/:id')
  .put(validar(schemaCard), actualizarCard)
  .delete(eliminarCard);

router.patch('/:id/mover', validar(schemaMoverCard), moverCard);

export default router;