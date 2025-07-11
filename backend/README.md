# honey-money-back-end

Este proyecto es el backend de **Honey Money**, desarrollado con Node.js, Express y Supabase. Su objetivo principal es gestionar usuarios, permitiendo su registro, autenticación y consulta.

## Tecnologías utilizadas

- **Node.js** y **Express**: Para la creación del servidor y la gestión de rutas.
- **Supabase**: Para la autenticación y almacenamiento de datos de usuarios.
- **dotenv**: Para la gestión de variables de entorno.
- **CORS**: Para permitir solicitudes desde otros orígenes.

## Instalación

1. Clona el repositorio.
2. Instala las dependencias:
   ```
   npm install
   ```
3. Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:
   ```
   SUPABASE_URL=tu_url_de_supabase
   SUPABASE_KEY=tu_clave_de_supabase
   PORT=3000
   ```

## Uso

Para iniciar el servidor:
```
npm start
```
El servidor correrá por defecto en `http://localhost:3000`.

## Endpoints principales

- **GET `/usuarios/`**  
  Devuelve todos los usuarios registrados.

- **POST `/usuarios/signup`**  
  Registra un nuevo usuario.  
  **Body esperado:**
  ```json
  {
    "nombre": "string",
    "apellido": "string",
    "dni": "string",
    "nacionalidad": "string",
    "gmail": "string",
    "telefono": "string",
    "contraseña": "string",
    "fecha_de_nacimiento": "YYYY-MM-DD"
  }
  ```

- **POST `/usuarios/login`**  
  Inicia sesión de usuario.  
  **Body esperado:**
  ```json
  {
    "gmail": "string", // o "dni": "string"
    "contraseña": "string"
  }
  ```

- **POST `/usuarios/logout`**  
  Cierra la sesión del usuario.  
  **Requiere:** Enviar el token de sesión en el header `Authorization`.
  
  **Ejemplo de uso:**
  ```http
  POST /usuarios/logout HTTP/1.1
  Host: localhost:3000
  Authorization: Bearer TU_TOKEN_AQUI
  ```
  **Respuesta exitosa:**
  ```json
  {
    "message": "Sesión cerrada correctamente"
  }
  ```

- **DELETE `/usuarios/delete`**  
  Elimina la cuenta del usuario autenticado.  
  **Requiere:** Enviar el token de sesión en el header `Authorization`.
  
  **Ejemplo de uso:**
  ```http
  DELETE /usuarios/delete HTTP/1.1
  Host: localhost:3000
  Authorization: Bearer TU_TOKEN_AQUI
  ```
  **Respuesta exitosa:**
  ```json
  {
    "message": "Cuenta eliminada correctamente"
  }
  ```

## Estructura del proyecto

- `index.js`: Punto de entrada del servidor.
- `routes/usuarios.js`: Define las rutas relacionadas con usuarios.
- `controllers/usuariosController.js`: Lógica de negocio para usuarios.
- `supabaseClient.js`: Configuración del cliente de Supabase.

## Manejo de errores

La API puede devolver distintos errores según la operación y los datos enviados. A continuación se listan los errores más comunes:

### Errores en el registro (`/usuarios/signup`)

- **400 Bad Request**  
  - Cuando faltan campos obligatorios en el body.
  - Cuando el gmail ya está registrado en Supabase.
  - Cuando hay un error al insertar el usuario en la base de datos.
  - Cuando ya existe un usuario con el mismo gmail o DNI.
  - **Respuesta ejemplo:**
    ```json
    {
      "error": "Ya existe un usuario con ese gmail o DNI"
    }
    ```

- **500 Internal Server Error**  
  - Cuando ocurre un error inesperado al comunicarse con Supabase.
  - **Respuesta ejemplo:**
    ```json
    {
      "error": "Error al obtener los usuarios"
    }
    ```

### Errores en el login (`/usuarios/login`)

- **400 Bad Request**  
  - Cuando no se proporciona ni gmail ni DNI.
  - **Respuesta ejemplo:**
    ```json
    {
      "error": "Debes proporcionar gmail o dni"
    }
    ```

- **401 Unauthorized**  
  - Cuando el usuario no existe con el DNI proporcionado.
  - Cuando la contraseña es incorrecta.
  - **Respuesta ejemplo:**
    ```json
    {
      "error": "Usuario no encontrado con ese DNI"
    }
    ```
    o
    ```json
    {
      "error": "Contraseña incorrecta"
    }
    ```

### Errores en el logout (`/usuarios/logout`)

- **401 Unauthorized**  
  - Cuando no se envía el token en el header `Authorization`.
  - **Respuesta ejemplo:**
    ```json
    {
      "error": "No token provided"
    }
    ```

- **400 Bad Request**  
  - Cuando el token es inválido o ya expiró.
  - **Respuesta ejemplo:**
    ```json
    {
      "error": "Token inválido o expirado"
    }
    ```

### Errores al eliminar cuenta (`/usuarios/delete`)

- **401 Unauthorized**  
  - Cuando no se envía el token en el header `Authorization`.
  - **Respuesta ejemplo:**
    ```json
    {
      "error": "No token provided"
    }
    ```

- **400 Bad Request**  
  - Cuando el token es inválido, expirado o hay un error al eliminar la cuenta.
  - **Respuesta ejemplo:**
    ```json
    {
      "error": "Token inválido o expirado"
    }
    ```

### Errores generales

- **.env no configurado correctamente**  
  Si las variables `SUPABASE_URL` o `SUPABASE_KEY` no están definidas, el servidor no podrá conectarse a Supabase y lanzará errores al intentar registrar o autenticar usuarios.

- **Cualquier otro error inesperado**  
  El servidor puede devolver un error 500 con un mensaje genérico.

## Notas

- Recuerda no subir tu archivo `.env` al repositorio.
- Este backend está pensado para ser consumido por un frontend o aplicaciones móviles. 