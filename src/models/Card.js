import mongoose from 'mongoose';

const cardSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: [true, 'El título de la tarjeta es obligatorio'],
      trim: true,
    },
    descripcion: {
      type: String,
      trim: true,
      default: '',
    },
    orden: {
      type: Number,
      default: 0,
    },
    // Prioridad de la tarjeta
    prioridad: {
      type: String,
      enum: ['baja', 'media', 'alta'],
      default: 'media',
    },
    // Fecha límite opcional
    fechaLimite: {
      type: Date,
      default: null,
    },
    // Referencia a la columna donde vive la tarjeta
    columna: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Column',
      required: true,
    },
    // Referencia al tablero para facilitar consultas
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

const Card = mongoose.model('Card', cardSchema);

export default Card;