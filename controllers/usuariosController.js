import supabase from '../supabaseClient.js';

export const holaMundo = (req, res) => {
    res.json({ message: 'hola mundo express'});
};

export const obtenerUsuarios = async (req, res) => {
    const { data, error } = await supabase
        .from('Usuarios')
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
        f_nac,
        correo,
        telefono,
        contrasena
    } = req.body;

    // Verificar si ya existe un usuario con el mismo correo o dni
    const { data: existingUser, error: searchError } = await supabase
        .from('usuarios')
        .select('*')
        .or(`correo.eq.${correo},dni.eq.${dni}`)
        .maybeSingle();
    if (searchError) {
        return res.status(500).json({ error: 'Error al verificar usuario existente' });
    }
    if (existingUser) {
        return res.status(400).json({ error: 'Ya existe un usuario con ese correo o DNI' });
    }

    // Registro en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
        correo: correo,
        contraseña: contrasena
    });
    if (authError) {
        return res.status(400).json({ error: authError.message });
    }

    // Registro en la tabla usuario
    const { data: userData, error: userError } = await supabase
        .from('Usuarios')
        .insert([
            {
                nombre_completo: nombre + ' ' + apellido,
                dni,
                f_nac,
                correo,
                telefono,
                contrasena,
                saldo: 0
    }]);
    if (userError) {
        return res.status(400).json({ error: userError.message });
    }

    return res.status(201).json({ message: 'Usuario registrado correctamente', authData, userData });
}






// Login de usuario con autenticación de Supabase
export const login = async (req, res) => {
    const { correo, dni, contrasena } = req.body;
    let emailToUse = correo;

    // Si no se proporciona correo, buscar por dni
    if (!correo && dni) {
        const { data: userData, error: userError } = await supabase
            .from('usuarios')
            .select('correo')
            .eq('dni', dni)
            .single();
        if (userError || !userData) {
            return res.status(401).json({ error: 'Usuario no encontrado con ese DNI' });
        }
        emailToUse = userData.correo;
    }

    if (!emailToUse) {
        return res.status(400).json({ error: 'Debes proporcionar correo o dni' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: contrasena
    });
    if (error) {
        return res.status(401).json({ error: error.message });
    }

    // Buscar el nombre en la tabla usuarios
    const { data: userInfo, error: userInfoError } = await supabase
        .from('usuarios')
        .select('nombre')
        .eq('correo', emailToUse.toLowerCase())
        .single();

    let nombre = '';
    if (userInfo && userInfo.nombre) {
        nombre = userInfo.nombre;
    }

    return res.status(200).json({ message: 'Login exitoso', nombre, data });
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
        .from('usuarios')
        .delete()
        .eq('id', userId);
    if (deleteDbError) {
        return res.status(400).json({ error: deleteDbError.message });
    }

    return res.status(200).json({ message: 'Cuenta eliminada correctamente' });
}

// Transferir dinero entre usuarios
export const transferir = async (req, res) => {
    const { remitente_id, destinatario_id, monto } = req.body;

    if (!remitente_id || !destinatario_id || !monto) {
        return res.status(400).json({ error: 'Faltan datos: remitente_id, destinatario_id o monto' });
    }

    if (monto <= 0) {
        return res.status(400).json({ error: 'El monto debe ser mayor que 0' });
    }

    const { data: remitente, error: remitenteError } = await supabase
        .from('usuarios')
        .select('id, saldo, nombre')
        .eq('id', remitente_id)
        .single();

    if (remitenteError || !remitente) {
        return res.status(404).json({ error: 'Remitente no encontrado' });
    }

    if (remitente.saldo < monto) {
        return res.status(400).json({ error: 'Saldo insuficiente para realizar la transferencia' });
    }

    const { data: destinatario, error: destinatarioError } = await supabase
        .from('usuarios')
        .select('id, saldo, nombre')
        .eq('id', destinatario_id)
        .single();

    if (destinatarioError || !destinatario) {
        return res.status(404).json({ error: 'Destinatario no encontrado' });
    }

    const nuevoSaldoRemitente = remitente.saldo - monto;
    const nuevoSaldoDestinatario = destinatario.saldo + monto;

    const { error: updateError1 } = await supabase
        .from('usuarios')
        .update({ saldo: nuevoSaldoRemitente })
        .eq('id', remitente_id);

    if (updateError1) {
        return res.status(500).json({ error: 'Error al actualizar saldo del remitente' });
    }

    const { error: updateError2 } = await supabase
        .from('usuarios')
        .update({ saldo: nuevoSaldoDestinatario })
        .eq('id', destinatario_id);

    if (updateError2) {
        await supabase
            .from('usuarios')
            .update({ saldo: remitente.saldo })
            .eq('id', remitente_id);
        return res.status(500).json({ error: 'Error al actualizar saldo del destinatario, se revirtió la operación' });
    }

    return res.status(200).json({
        message: `Transferencia realizada con éxito`,
        detalle: {
            de: remitente.nombre,
            a: destinatario.nombre,
            monto,
            saldo_actual_remitente: nuevoSaldoRemitente,
            saldo_actual_destinatario: nuevoSaldoDestinatario
        }
    });
};

// Recibir dinero en la cuenta de un usuario
export const recibirDinero = async (req, res) => {
    const { usuario_id, monto } = req.body;

    if (!usuario_id || !monto) {
        return res.status(400).json({ error: 'Faltan datos: usuario_id o monto' });
    }

    if (monto <= 0) {
        return res.status(400).json({ error: 'El monto debe ser mayor que 0' });
    }

    const { data: usuario, error: usuarioError } = await supabase
        .from('usuarios')
        .select('id, saldo, nombre')
        .eq('id', usuario_id)
        .single();

    if (usuarioError || !usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const nuevoSaldo = usuario.saldo + monto;

    const { error: updateError } = await supabase
        .from('usuarios')
        .update({ saldo: nuevoSaldo })
        .eq('id', usuario_id);

    if (updateError) {
        return res.status(500).json({ error: 'Error al actualizar el saldo del usuario' });
    }

    return res.status(200).json({
        message: `Saldo actualizado correctamente`,
        usuario: usuario.nombre,
        monto_recibido: monto,
        saldo_actual: nuevoSaldo
    });
};

// Agregar dinero al saldo del usuario autenticado
export const addAmount = async (req, res) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const { monto } = req.body;

    if (!monto || monto <= 0) {
        return res.status(400).json({ error: 'Debes ingresar un monto válido mayor a 0' });
    }

    // Obtener el usuario autenticado
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
        return res.status(401).json({ error: 'Token inválido o sesión expirada' });
    }

    const userEmail = userData.user.email;

    // Buscar al usuario en la tabla "usuarios" por su correo
    const { data: usuario, error: usuarioError } = await supabase
        .from('usuarios')
        .select('id, nombre, saldo')
        .eq('correo', userEmail)
        .single();

    if (usuarioError || !usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado en la base de datos' });
    }

    const nuevoSaldo = (usuario.saldo || 0) + monto;

    // Actualizar el saldo del usuario
    const { error: updateError } = await supabase
        .from('usuarios')
        .update({ saldo: nuevoSaldo })
        .eq('id', usuario.id);

    if (updateError) {
        return res.status(500).json({ error: 'Error al actualizar el saldo' });
    }

    return res.status(200).json({
        message: 'Monto agregado exitosamente',
        usuario: usuario.nombre,
        monto_agregado: monto,
        saldo_actual: nuevoSaldo
    });
};

// Pago de servicios desde el saldo del usuario autenticado
export const pagoServicios = async (req, res) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const { servicio, monto } = req.body;

    // Validar datos
    if (!servicio || !monto) {
        return res.status(400).json({ error: 'Faltan datos: servicio o monto' });
    }

    if (monto <= 0) {
        return res.status(400).json({ error: 'El monto debe ser mayor que 0' });
    }

    // Lista simulada de servicios disponibles
    const serviciosDisponibles = [
        { nombre: 'luz', descripcion: 'Pago de energía eléctrica' },
        { nombre: 'agua', descripcion: 'Pago del servicio de agua corriente' },
        { nombre: 'internet', descripcion: 'Pago del servicio de internet' },
        { nombre: 'cargar_saldo_celular', descripcion: 'Recarga de saldo móvil' }
    ];

    // Verificar que el servicio exista
    const servicioEncontrado = serviciosDisponibles.find(s => s.nombre === servicio.toLowerCase());
    if (!servicioEncontrado) {
        return res.status(400).json({ 
            error: 'Servicio no válido',
            servicios_disponibles: serviciosDisponibles.map(s => s.nombre)
        });
    }

    // Obtener usuario autenticado
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
        return res.status(401).json({ error: 'Token inválido o sesión expirada' });
    }

    const userEmail = userData.user.email;

    // Buscar el usuario en la base de datos
    const { data: usuario, error: usuarioError } = await supabase
        .from('usuarios')
        .select('id, nombre, saldo')
        .eq('correo', userEmail)
        .single();

    if (usuarioError || !usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar saldo suficiente
    if (usuario.saldo < monto) {
        return res.status(400).json({ error: 'Saldo insuficiente para realizar el pago' });
    }

    // Restar el monto del saldo
    const nuevoSaldo = usuario.saldo - monto;

    const { error: updateError } = await supabase
        .from('usuarios')
        .update({ saldo: nuevoSaldo })
        .eq('id', usuario.id);

    if (updateError) {
        return res.status(500).json({ error: 'Error al procesar el pago' });
    }

    return res.status(200).json({
        message: 'Pago realizado exitosamente',
        usuario: usuario.nombre,
        servicio_pagado: servicioEncontrado.nombre,
        descripcion: servicioEncontrado.descripcion,
        monto_pagado: monto,
        saldo_actual: nuevoSaldo
    });
};
