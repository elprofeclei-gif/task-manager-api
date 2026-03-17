import Board from '../models/Board.js';

/**
 * Verifica que el tablero existe y pertenece al usuario autenticado
 */
const verificarPropiedad = (board, usuarioId) => {
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
 * GET /api/boards
 * Obtiene todos los tableros del usuario autenticado
 */
export const obtenerBoards = async (req, res, next) => {
  try {
    const boards = await Board.find({ usuario: req.usuario._id });
    res.json(boards);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/boards
 * Crea un nuevo tablero
 */
export const crearBoard = async (req, res, next) => {
  try {
    const { nombre, descripcion } = req.body;
    const board = await Board.create({
      nombre,
      descripcion,
      usuario: req.usuario._id,
    });
    res.status(201).json(board);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/boards/:id
 * Obtiene un tablero por su ID
 */
export const obtenerBoardPorId = async (req, res, next) => {
  try {
    const board = await Board.findById(req.params.id);
    verificarPropiedad(board, req.usuario._id);
    res.json(board);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/boards/:id
 * Actualiza un tablero existente
 */
export const actualizarBoard = async (req, res, next) => {
  try {
    const board = await Board.findById(req.params.id);
    verificarPropiedad(board, req.usuario._id);

    const boardActualizado = await Board.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    res.json(boardActualizado);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/boards/:id
 * Elimina un tablero
 */
export const eliminarBoard = async (req, res, next) => {
  try {
    const board = await Board.findById(req.params.id);
    verificarPropiedad(board, req.usuario._id);
    await board.deleteOne();
    res.json({ mensaje: 'Tablero eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};