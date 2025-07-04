import supabase from '../supabaseClient.js';

export const obtenerUsuarios = async (req, res) => {
    const { data, error } = await supabase
        .from('usuario')
        .select('*');
    if(error){
        return res.status(500).json({ error: 'Error al obtener los usuarios' });
    }
    return res.status(200).json(data);
}

// Registro de usuario con autenticación de Supabase
export const signUp = async (req, res) => {
    const {
        nombre_completo,
        dni,
        fecha_de_nacimiento,
        nacionalidad,
        correo_electronico,
        numero_de_celular,
        contraseña
    } = req.body;

    // Registro en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: correo_electronico,
        password: contraseña
    });
    if (authError) {
        return res.status(400).json({ error: authError.message });
    }

    // Registro en la tabla usuario
    const { data: userData, error: userError } = await supabase
        .from('usuario')
        .insert([
            {
                nombre_completo,
                dni,
                fecha_de_nacimiento,
                nacionalidad,
                correo_electronico,
                numero_de_celular,
                contraseña
            }
        ]);
    if (userError) {
        return res.status(400).json({ error: userError.message });
    }

    return res.status(201).json({ message: 'Usuario registrado correctamente', authData, userData });
}

// Login de usuario con autenticación de Supabase
export const login = async (req, res) => {
    const { correo_electronico, dni, contraseña } = req.body;
    let emailToUse = correo_electronico;

    // Si no se proporciona correo, buscar por dni
    if (!correo_electronico && dni) {
        // Buscar el usuario por dni en la tabla usuario
        const { data: userData, error: userError } = await supabase
            .from('usuario')
            .select('correo_electronico')
            .eq('dni', dni)
            .single();
        if (userError || !userData) {
            return res.status(401).json({ error: 'Usuario no encontrado con ese DNI' });
        }
        emailToUse = userData.correo_electronico;
    }

    if (!emailToUse) {
        return res.status(400).json({ error: 'Debes proporcionar correo_electronico o dni' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: contraseña
    });
    if (error) {
        return res.status(401).json({ error: error.message });
    }
    return res.status(200).json({ message: 'Login exitoso', data });
}