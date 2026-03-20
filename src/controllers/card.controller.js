import Card from '../models/Card.js';
import Column from '../models/Column.js';
import Board from '../models/Board.js';

/**
 * Verifica que el tablero y la columna existan y pertenezcan al usuario autenticado.
 * Se usa en todas las operaciones de tarjetas para garantizar autorización.
 *
 * @param {string} columnId - ID de la columna a verificar
 * @param {string} boardId - ID del tablero al que debe pertenecer la columna
 * @param {string} usuarioId - ID del usuario autenticado
 * @returns {{ board: object, columna: object }} Documentos verificados
 * @throws {Error} 404 si no se encuentra, 403 si no hay permiso
 */
const verificarColumna = async (columnId, boardId, usuarioId) => {
  const board = await Board.findById(boardId);
  if (!board) {
    const err = new Error('Tablero no encontrado');
    err.status = 404;
    throw err;
  }
  if (board.usuario.toString() !== usuarioId.toString()) {
    const err = new Error('No tienes permiso sobre este tablero');
    err.status = 403;
    throw err;
  }

  const columna = await Column.findOne({ _id: columnId, board: boardId });
  if (!columna) {
    const err = new Error('Columna no encontrada');
    err.status = 404;
    throw err;
  }

  return { board, columna };
};

/**
 * GET /api/boards/:boardId/columns/:columnId/cards
 * Devuelve todas las tarjetas de una columna ordenadas por el campo `orden`.
 */
export const obtenerCards = async (req, res, next) => {
  try {
    const { boardId, columnId } = req.params;
    await verificarColumna(columnId, boardId, req.usuario._id);

    const cards = await Card.find({ columna: columnId }).sort('orden');
    res.json(cards);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/boards/:boardId/columns/:columnId/cards
 * Crea una nueva tarjeta dentro de una columna.
 */
export const crearCard = async (req, res, next) => {
  try {
    const { boardId, columnId } = req.params;
    await verificarColumna(columnId, boardId, req.usuario._id);

    const { titulo, descripcion, orden, prioridad, fechaLimite } = req.body;

    const card = await Card.create({
      titulo,
      descripcion,
      orden,
      prioridad,
      fechaLimite,
      columna: columnId,
      board: boardId,
    });

    res.status(201).json(card);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/boards/:boardId/columns/:columnId/cards/:id
 * Actualiza los datos de una tarjeta existente.
 *
 * Solo se permiten modificar los campos `titulo`, `descripcion`, `orden`,
 * `prioridad` y `fechaLimite`. Se desestructura req.body explícitamente
 * para evitar que un cliente sobreescriba campos protegidos como
 * `columna` o `board`, que tienen su propio endpoint dedicado (moverCard).
 */
export const actualizarCard = async (req, res, next) => {
  try {
    const { boardId, columnId, id } = req.params;
    await verificarColumna(columnId, boardId, req.usuario._id);

    // Whitelist de campos permitidos — nunca pasar req.body directo
    const { titulo, descripcion, orden, prioridad, fechaLimite } = req.body;

    const card = await Card.findOneAndUpdate(
      { _id: id, columna: columnId },
      { titulo, descripcion, orden, prioridad, fechaLimite },
      { new: true, runValidators: true }
    );

    if (!card) {
      const err = new Error('Tarjeta no encontrada');
      err.status = 404;
      throw err;
    }

    res.json(card);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/boards/:boardId/columns/:columnId/cards/:id/mover
 * Mueve una tarjeta a otra columna o cambia su posición dentro de la misma.
 *
 * La columna destino debe pertenecer al mismo tablero.
 * Este es el único endpoint autorizado para cambiar el campo `columna` de una tarjeta.
 */
export const moverCard = async (req, res, next) => {
  try {
    const { boardId, columnId, id } = req.params;
    const { columnaDestino, orden } = req.body;

    await verificarColumna(columnId, boardId, req.usuario._id);

    // Verificar que la columna destino pertenece al mismo tablero
    const columnaDestObj = await Column.findOne({ _id: columnaDestino, board: boardId });
    if (!columnaDestObj) {
      const err = new Error('Columna destino no encontrada');
      err.status = 404;
      throw err;
    }

    const card = await Card.findOneAndUpdate(
      { _id: id, columna: columnId },
      { columna: columnaDestino, orden },
      { new: true }
    );

    if (!card) {
      const err = new Error('Tarjeta no encontrada');
      err.status = 404;
      throw err;
    }

    res.json(card);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/boards/:boardId/columns/:columnId/cards/:id
 * Elimina una tarjeta.
 * Solo puede eliminarla el propietario del tablero al que pertenece.
 */
export const eliminarCard = async (req, res, next) => {
  try {
    const { boardId, columnId, id } = req.params;
    await verificarColumna(columnId, boardId, req.usuario._id);

    const card = await Card.findOneAndDelete({ _id: id, columna: columnId });

    if (!card) {
      const err = new Error('Tarjeta no encontrada');
      err.status = 404;
      throw err;
    }

    res.json({ mensaje: 'Tarjeta eliminada correctamente' });
  } catch (error) {
    next(error);
  }
};