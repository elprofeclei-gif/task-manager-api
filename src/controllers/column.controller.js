import Column from '../models/Column.js';
import Board from '../models/Board.js';

/**
 * Verifica que el tablero exista y pertenezca al usuario autenticado.
 * Se usa en todas las operaciones de columnas para garantizar autorización.
 *
 * @param {string} boardId - ID del tablero a verificar
 * @param {string} usuarioId - ID del usuario autenticado
 * @throws {Error} 404 si el tablero no existe, 403 si no pertenece al usuario
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
 * Devuelve todas las columnas de un tablero ordenadas por el campo `orden`.
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
 * Crea una nueva columna dentro de un tablero.
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
 * Actualiza el nombre y/o posición de una columna.
 *
 * Solo se permiten actualizar los campos `nombre` y `orden`.
 * Se desestructura req.body explícitamente para evitar que un cliente
 * pueda sobreescribir el campo `board` y mover la columna a otro tablero.
 */
export const actualizarColumna = async (req, res, next) => {
  try {
    await verificarBoard(req.params.boardId, req.usuario._id);

    // Whitelist de campos permitidos — nunca pasar req.body directo
    const { nombre, orden } = req.body;

    const columna = await Column.findOneAndUpdate(
      { _id: req.params.id, board: req.params.boardId },
      { nombre, orden },
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
 * Elimina una columna del tablero.
 * Solo puede eliminarla el propietario del tablero.
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