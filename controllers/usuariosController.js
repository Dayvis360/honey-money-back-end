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
        nombre,
        apellido,
        dni,
        nacionalidad,
        gmail,
        telefono,
        contraseña,
        fecha_de_nacimiento
    } = req.body;

    // Verificar si ya existe un usuario con el mismo gmail o dni
    const { data: existingUser, error: searchError } = await supabase
        .from('usuario')
        .select('*')
        .or(`gmail.eq.${gmail},dni.eq.${dni}`)
        .maybeSingle();
    if (searchError) {
        return res.status(500).json({ error: 'Error al verificar usuario existente' });
    }
    if (existingUser) {
        return res.status(400).json({ error: 'Ya existe un usuario con ese gmail o DNI' });
    }

    // Registro en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: gmail,
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
                nombre,
                apellido,
                dni,
                nacionalidad,
                gmail,
                telefono,
                contraseña,
                fecha_de_nacimiento
            }
        ]);
    if (userError) {
        return res.status(400).json({ error: userError.message });
    }

    return res.status(201).json({ message: 'Usuario registrado correctamente', authData, userData });
}

// Login de usuario con autenticación de Supabase
export const login = async (req, res) => {
    const { gmail, dni, contraseña } = req.body;
    let emailToUse = gmail;

    // Si no se proporciona gmail, buscar por dni
    if (!gmail && dni) {
        // Buscar el usuario por dni en la tabla usuario
        const { data: userData, error: userError } = await supabase
            .from('usuario')
            .select('gmail')
            .eq('dni', dni)
            .single();
        if (userError || !userData) {
            return res.status(401).json({ error: 'Usuario no encontrado con ese DNI' });
        }
        emailToUse = userData.gmail;
    }

    if (!emailToUse) {
        return res.status(400).json({ error: 'Debes proporcionar gmail o dni' });
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

// Logout de usuario con Supabase Auth
export const logout = async (req, res) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];

    // Llama a signOut usando el token
    const { error } = await supabase.auth.signOut({
        accessToken: token
    });
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    return res.status(200).json({ message: 'Sesión cerrada correctamente' });
}

// Eliminar cuenta de usuario
export const deleteAccount = async (req, res) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];

    // Obtener el usuario autenticado
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData || !userData.user) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
    const userId = userData.user.id;

    // Eliminar de Supabase Auth
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
        return res.status(400).json({ error: deleteAuthError.message });
    }

    // Eliminar de la tabla usuario (por id de auth)
    const { error: deleteDbError } = await supabase
        .from('usuario')
        .delete()
        .eq('id', userId);
    if (deleteDbError) {
        return res.status(400).json({ error: deleteDbError.message });
    }

    return res.status(200).json({ message: 'Cuenta eliminada correctamente' });
}
