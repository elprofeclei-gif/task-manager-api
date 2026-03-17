import mongoose from 'mongoose';

const columnSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre de la columna es obligatorio'],
      trim: true,
    },
    // Posición para ordenar las columnas dentro del tablero
    orden: {
      type: Number,
      default: 0,
    },
    // Referencia al tablero al que pertenece la columna
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Column = mongoose.model('Column', columnSchema);

export default Column;