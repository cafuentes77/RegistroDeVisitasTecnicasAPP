import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";

const UsuarioSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    nombre: { type: String, required: true },
    rol: {
      type: String,
      enum: ["técnico", "administrador"],
      default: "técnico",
    },
  },
  { timestamps: true }
);

// Cifrar contraseña antes de guardar
UsuarioSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Método para comparar contraseñas
UsuarioSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default model("Usuario", UsuarioSchema);
