import Board from '../models/Board.js';

/**
 * Verifica que el tablero exista y pertenezca al usuario autenticado.
 * Lanza un error controlado si no se cumple alguna condición.
 *
 * @param {object} board - Documento del tablero obtenido de la BD
 * @param {string} usuarioId - ID del usuario autenticado
 * @throws {Error} 404 si el tablero no existe, 403 si no pertenece al usuario
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
 * Devuelve todos los tableros que pertenecen al usuario autenticado.
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
 * Crea un nuevo tablero asociado al usuario autenticado.
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
 * Devuelve un tablero específico por su ID.
 * Solo lo puede ver el usuario propietario.
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
 * Actualiza el nombre y/o descripción de un tablero.
 *
 * Solo se permiten actualizar los campos `nombre` y `descripcion`.
 * Se desestructura req.body explícitamente para evitar que un cliente
 * pueda sobreescribir campos protegidos como `usuario` enviándolos en el body.
 */
export const actualizarBoard = async (req, res, next) => {
  try {
    const board = await Board.findById(req.params.id);
    verificarPropiedad(board, req.usuario._id);

    // Whitelist de campos permitidos — nunca pasar req.body directo
    const { nombre, descripcion } = req.body;

    const boardActualizado = await Board.findByIdAndUpdate(
      req.params.id,
      { nombre, descripcion },
      { new: true, runValidators: true }
    );
    res.json(boardActualizado);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/boards/:id
 * Elimina un tablero.
 * Solo lo puede eliminar el usuario propietario.
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