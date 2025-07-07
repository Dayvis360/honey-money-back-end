import express from 'express';
import { obtenerUsuarios, signUp, login, logout, deleteAccount } from '../controllers/usuariosController.js';

const router = express.Router();


// Obtener todos los usuarios
router.get('/', obtenerUsuarios);

// Registro (sign up)
// Espera: nombre, apellido, dni, nacionalidad, gmail, telefono, contraseña, fecha_de_nacimiento
router.post('/signup', signUp);

// Login
// Espera: gmail o dni, y contraseña
router.post('/login', login);

// Logout
// Espera: header Authorization con el token
router.post('/logout', logout);

// Eliminar cuenta
// Espera: header Authorization con el token
router.delete('/delete', deleteAccount);

export default router;
