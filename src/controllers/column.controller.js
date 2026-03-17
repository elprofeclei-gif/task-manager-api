import Column from '../models/Column.js';
import Board from '../models/Board.js';

/**
 * Verifica que el tablero existe y pertenece al usuario autenticado
 */
const verificarBoard = async (boardId, usuarioId) => {
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
};

/**
 * GET /api/boards/:boardId/columns
 * Obtiene todas las columnas de un tablero ordenadas por posición
 */
export const obtenerColumnas = async (req, res, next) => {
  try {
    await verificarBoard(req.params.boardId, req.usuario._id);
    const columnas = await Column.find({ board: req.params.boardId }).sort('orden');
    res.json(columnas);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/boards/:boardId/columns
 * Crea una nueva columna en un tablero
 */
export const crearColumna = async (req, res, next) => {
  try {
    await verificarBoard(req.params.boardId, req.usuario._id);

    const { nombre, orden } = req.body;

    const columna = await Column.create({
      nombre,
      orden,
      board: req.params.boardId,
    });

    res.status(201).json(columna);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/boards/:boardId/columns/:id
 * Actualiza una columna existente
 */
export const actualizarColumna = async (req, res, next) => {
  try {
    await verificarBoard(req.params.boardId, req.usuario._id);

    const columna = await Column.findOneAndUpdate(
      { _id: req.params.id, board: req.params.boardId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!columna) {
      const err = new Error('Columna no encontrada');
      err.status = 404;
      throw err;
    }

    res.json(columna);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/boards/:boardId/columns/:id
 * Elimina una columna
 */
export const eliminarColumna = async (req, res, next) => {
  try {
    await verificarBoard(req.params.boardId, req.usuario._id);

    const columna = await Column.findOneAndDelete({
      _id: req.params.id,
      board: req.params.boardId,
    });

    if (!columna) {
      const err = new Error('Columna no encontrada');
      err.status = 404;
      throw err;
    }

    res.json({ mensaje: 'Columna eliminada correctamente' });
  } catch (error) {
    next(error);
  }
};