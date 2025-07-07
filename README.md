# honey-money-back-end
este sera el back de honey money

# Documentación del Backend

## Endpoints principales

### POST /usuarios/signup
Registra un nuevo usuario. Requiere los siguientes campos:
- nombre
- apellido
- dni
- nacionalidad
- gmail
- telefono
- contraseña
- fecha_de_nacimiento

**Errores comunes:**
- `500 Internal Server Error` con mensaje `Error al verificar usuario existente`: Puede deberse a que la tabla `usuarios` no existe, está mal nombrada o hay un problema de permisos en Supabase.
- `Password should be at least 6 characters.`: La contraseña debe tener al menos 6 caracteres (requisito de Supabase Auth).

### POST /usuarios/login
Inicia sesión con gmail o dni y contraseña. Si el login es exitoso, la respuesta incluye:
- `nombre`: el nombre del usuario (obtenido de la tabla `usuarios`)
- `data`: datos de autenticación de Supabase

**Errores comunes:**
- Si el campo `nombre` aparece vacío en la respuesta, asegúrate de que el correo (`gmail`) en la tabla `usuarios` esté en minúsculas y que el campo `nombre` no esté vacío.
- El backend busca el correo en minúsculas para evitar problemas de coincidencia.

**Nota:** El frontend debe guardar el campo `nombre` en `localStorage` para mostrarlo en el home tras el login. El nombre solo se guarda al iniciar sesión, no al registrarse.

## Flujo de integración Frontend-Backend

1. **Registro:**
   - El usuario completa el formulario de registro.
   - El frontend envía los datos a `/usuarios/signup`.
   - Si el registro es exitoso, el usuario puede iniciar sesión.

2. **Login:**
   - El usuario inicia sesión con correo/dni y contraseña.
   - El backend autentica y busca el nombre en la tabla `usuarios`.
   - El frontend guarda el nombre recibido en `localStorage`.
   - El home lee el nombre desde `localStorage` y lo muestra en pantalla.

## Errores y soluciones frecuentes

- **No se muestra el nombre en el home:**
  - Verifica que el backend devuelva el campo `nombre` en la respuesta del login.
  - Asegúrate de que el correo en la tabla `usuarios` esté en minúsculas y que el campo `nombre` tenga valor.
  - El frontend debe guardar el nombre en `localStorage` tras el login.

- **Error 500 al registrar:**
  - Revisa que la tabla `usuarios` exista y tenga todas las columnas requeridas.
  - Verifica los permisos y las políticas de RLS en Supabase.

- **Contraseña demasiado corta:**
  - Supabase requiere al menos 6 caracteres para la contraseña.

- **Problemas con mayúsculas/minúsculas:**
  - El backend y el frontend convierten los correos a minúsculas para evitar errores de coincidencia.

## Notas adicionales

- El nombre y apellido se capitalizan visualmente solo en los formularios, pero se guardan tal como los escribe el usuario.
- Los campos de contraseña nunca aplican mayúscula automática ni autocorrección.
- El home muestra el nombre guardado en `localStorage` tras el login exitoso.

## Endpoint de producción

El backend está desplegado en:

https://honey-money-back-end-production.up.railway.app/usuarios/
