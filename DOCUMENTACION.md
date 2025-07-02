# Documentación: Conexión Node.js con Supabase

## 1. Instalación de dependencias

Ejecuta en la terminal:

```
npm install express cors dotenv @supabase/supabase-js
```

## 2. Configuración de variables de entorno

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido (reemplaza los valores por los de tu proyecto Supabase):

```
SUPABASE_URL=https://<tu-proyecto>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<tu_service_role_key>
```

## 3. Cliente de Supabase

Archivo: `supabaseClient.js`
```js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = supabase;
```

## 4. Prueba de conexión a Supabase

Archivo: `index.js`
```js
const supabase = require('./supabaseClient');

async function testConnection() {
  const { data, error } = await supabase.from('usuario').select('*').limit(1);
  if (error) {
    console.error('Error al conectar con Supabase:', error.message);
  } else {
    console.log('Conexión exitosa. Datos:', data);
  }
}

testConnection();
```

## 5. Ejecución del script

En la terminal, ejecuta:

```
node index.js
```

Si todo está correcto, verás los datos de la tabla `usuario` en la consola.

---

## 6. Fallos comunes y soluciones

### a) Error: "supabaseUrl is required."
- Causa: Las variables de entorno no están definidas o el archivo `.env` no está bien configurado.
- Solución: Verifica que el archivo `.env` exista y tenga los valores correctos para `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.

### b) Error: "Invalid URL"
- Causa: El valor de `SUPABASE_URL` no es una URL válida o hay espacios/caracteres extra.
- Solución: Asegúrate de que la URL sea exactamente la proporcionada por Supabase y no tenga espacios ni caracteres adicionales.

### c) Error: "relation 'public.tu_tabla' does not exist"
- Causa: El nombre de la tabla en el código no coincide con el de la base de datos.
- Solución: Cambia `'tu_tabla'` por el nombre real de tu tabla, por ejemplo `'usuario'`.

### d) Error: "No se puede cargar el archivo npm.ps1 porque la ejecución de scripts está deshabilitada en este sistema."
- Causa: Política de ejecución de PowerShell restringida.
- Solución: Ejecuta PowerShell como administrador y corre:
  ```powershell
  Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
  ```

### e) No se muestran datos o variables de entorno no se actualizan
- Causa: Cambios recientes en `.env` o archivos no guardados.
- Solución: Guarda todos los archivos y reinicia la terminal antes de ejecutar el script nuevamente.

---

**Notas:**
- Asegúrate de que el nombre de la tabla en el código coincida exactamente con el de tu base de datos.
- Si cambias las variables de entorno, reinicia la terminal antes de ejecutar el script nuevamente.
- No compartas tu `SERVICE_ROLE_KEY` en público.
