import express from 'express';
import usuariosRouter from './routes/usuarios.js';
import dotenv from 'dotenv';
import cors from 'cors';
dotenv.config();


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Ruta principal
app.use('/usuarios', usuariosRouter);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
