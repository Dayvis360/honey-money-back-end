import express from 'express';
import { obtenerUsuarios, signUp, login } from '../controllers/usuariosController.js';

const router = express.Router();


// Obtener todos los usuarios
router.get('/', obtenerUsuarios);

// Registro (sign up)
router.post('/signup', signUp);

// Login
router.post('/login', login);

export default router;
