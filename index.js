// Prueba de conexión a Supabase
const supabase = require('./supabaseClient');

async function testConnection() {
  // Cambia 'tu_tabla' por el nombre de una tabla real en tu base de datos Supabase
  const { data, error } = await supabase.from('usuario').select('*');
  if (error) {
    console.error('Error al conectar con Supabase:', error.message);
  } else {
    console.log('Conexión exitosa. Datos:', data);
  }
}

testConnection();
