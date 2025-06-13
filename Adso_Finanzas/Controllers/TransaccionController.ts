import { Transaccion } from "../Models/TransaccionModel.ts";
import { z } from "../Dependencies/Dependencias.ts";
import { Context } from "https://deno.land/x/oak@v17.1.3/mod.ts";

// Interfaz para el contexto con params
interface ContextWithParams extends Context {
    params: { [key: string]: string };
}

// Esquemas de validación con Zod
const transaccionSchema = z.object({
    cuenta_id: z.number().positive("La cuenta es requerida"),
    categoria_id: z.number().positive("La categoría es requerida"),
    tipo: z.enum(['ingreso', 'gasto'], {
        errorMap: () => ({ message: "El tipo debe ser 'ingreso' o 'gasto'" })
    }),
    monto: z.number().positive("El monto debe ser mayor a 0"),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato YYYY-MM-DD"),
    descripcion: z.string().optional()
});

const filtrosSchema = z.object({
    fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    fecha_fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    categoria_id: z.string().transform((val: string) => val ? parseInt(val) : undefined).optional(),
    tipo: z.enum(['ingreso', 'gasto']).optional(),
    cuenta_id: z.string().transform((val: string) => val ? parseInt(val) : undefined).optional()
});

// Obtener todas las transacciones del usuario autenticado
export const getTransacciones = async (ctx: Context) => {
    const { response } = ctx;
    
    try {
        const usuario_id = parseInt(ctx.state.user.sub);
        const objTransaccion = new Transaccion();
        
        const transacciones = await objTransaccion.obtenerTransaccionesPorUsuario(usuario_id);
        
        response.status = 200;
        response.body = {
            success: true,
            message: "Transacciones obtenidas correctamente",
            data: transacciones
        };
    } catch (error) {
        console.error("Error al obtener transacciones:", error);
        response.status = 500;
        response.body = {
            success: false,
            message: "Error interno del servidor"
        };
    }
};

// Crear una nueva transacción
export const postTransaccion = async (ctx: Context) => {
    const { request, response } = ctx;
    
    try {
        if (!request.hasBody) {
            response.status = 400;
            response.body = { success: false, message: "Cuerpo vacío" };
            return;
        }

        const body = await request.body.json();
        const usuario_id = parseInt(ctx.state.user.sub);

        // Validar datos con Zod
        const validacion = transaccionSchema.safeParse(body);
        if (!validacion.success) {
            response.status = 400;
            response.body = {
                success: false,
                message: "Datos inválidos",
                errors: validacion.error.errors
            };
            return;
        }

        const transaccionData = {
            ...validacion.data,
            usuario_id
        };

        const objTransaccion = new Transaccion();
        const resultado = await objTransaccion.crearTransaccion(transaccionData);
        
        if (resultado.success) {
            response.status = 201;
            response.body = resultado;
        } else {
            response.status = 400;
            response.body = resultado;
        }
    } catch (error) {
        console.error("Error al crear transacción:", error);
        response.status = 500;
        response.body = {
            success: false,
            message: "Error interno del servidor"
        };
    }
};

// Actualizar una transacción existente
export const putTransaccion = async (ctx: ContextWithParams) => {
    const { request, response, params } = ctx;
    
    try {
        if (!request.hasBody) {
            response.status = 400;
            response.body = { success: false, message: "Cuerpo vacío" };
            return;
        }

        const body = await request.body.json();
        const usuario_id = parseInt(ctx.state.user.sub);
        const transaccion_id = parseInt(params.id);

        if (!transaccion_id) {
            response.status = 400;
            response.body = { success: false, message: "ID de transacción inválido" };
            return;
        }

        // Validar datos con Zod
        const validacion = transaccionSchema.safeParse(body);
        if (!validacion.success) {
            response.status = 400;
            response.body = {
                success: false,
                message: "Datos inválidos",
                errors: validacion.error.errors
            };
            return;
        }

        const transaccionData = {
            ...validacion.data,
            usuario_id
        };

        const objTransaccion = new Transaccion();
        const resultado = await objTransaccion.actualizarTransaccion(transaccion_id, transaccionData);
        
        if (resultado.success) {
            response.status = 200;
            response.body = resultado;
        } else {
            response.status = 400;
            response.body = resultado;
        }
    } catch (error) {
        console.error("Error al actualizar transacción:", error);
        response.status = 500;
        response.body = {
            success: false,
            message: "Error interno del servidor"
        };
    }
};

// Eliminar una transacción
export const deleteTransaccion = async (ctx: ContextWithParams) => {
    const { response, params } = ctx;
    
    try {
        const usuario_id = parseInt(ctx.state.user.sub);
        const transaccion_id = parseInt(params.id);

        if (!transaccion_id) {
            response.status = 400;
            response.body = { success: false, message: "ID de transacción inválido" };
            return;
        }

        const objTransaccion = new Transaccion();
        const resultado = await objTransaccion.eliminarTransaccion(transaccion_id, usuario_id);
        
        if (resultado.success) {
            response.status = 200;
            response.body = resultado;
        } else {
            response.status = 400;
            response.body = resultado;
        }
    } catch (error) {
        console.error("Error al eliminar transacción:", error);
        response.status = 500;
        response.body = {
            success: false,
            message: "Error interno del servidor"
        };
    }
};

// Obtener cuentas del usuario
export const getCuentas = async (ctx: Context) => {
    const { response } = ctx;
    
    try {
        const usuario_id = parseInt(ctx.state.user.sub);
        const objTransaccion = new Transaccion();
        
        const cuentas = await objTransaccion.obtenerCuentasPorUsuario(usuario_id);
        
        response.status = 200;
        response.body = {
            success: true,
            message: "Cuentas obtenidas correctamente",
            data: cuentas
        };
    } catch (error) {
        console.error("Error al obtener cuentas:", error);
        response.status = 500;
        response.body = {
            success: false,
            message: "Error interno del servidor"
        };
    }
};

// Obtener categorías del usuario
export const getCategorias = async (ctx: Context) => {
    const { response, request } = ctx;
    
    try {
        const usuario_id = parseInt(ctx.state.user.sub);
        const url = new URL(request.url);
        const tipo = url.searchParams.get('tipo') as 'ingreso' | 'gasto' | null;
        
        const objTransaccion = new Transaccion();
        const categorias = await objTransaccion.obtenerCategoriasPorUsuario(usuario_id, tipo || undefined);
        
        response.status = 200;
        response.body = {
            success: true,
            message: "Categorías obtenidas correctamente",
            data: categorias
        };
    } catch (error) {
        console.error("Error al obtener categorías:", error);
        response.status = 500;
        response.body = {
            success: false,
            message: "Error interno del servidor"
        };
    }
};

// Obtener transacciones con filtros
export const getTransaccionesFiltradas = async (ctx: Context) => {
    const { response, request } = ctx;
    
    try {
        const usuario_id = parseInt(ctx.state.user.sub);
        const url = new URL(request.url);
        
        const filtrosRaw = {
            fecha_inicio: url.searchParams.get('fecha_inicio'),
            fecha_fin: url.searchParams.get('fecha_fin'),
            categoria_id: url.searchParams.get('categoria_id'),
            tipo: url.searchParams.get('tipo'),
            cuenta_id: url.searchParams.get('cuenta_id')
        };

        // Validar filtros
        const validacion = filtrosSchema.safeParse(filtrosRaw);
        if (!validacion.success) {
            response.status = 400;
            response.body = {
                success: false,
                message: "Filtros inválidos",
                errors: validacion.error.errors
            };
            return;
        }

        const objTransaccion = new Transaccion();
        const transacciones = await objTransaccion.obtenerTransaccionesFiltradas(usuario_id, validacion.data);
        
        response.status = 200;
        response.body = {
            success: true,
            message: "Transacciones filtradas obtenidas correctamente",
            data: transacciones
        };
    } catch (error) {
        console.error("Error al obtener transacciones filtradas:", error);
        response.status = 500;
        response.body = {
            success: false,
            message: "Error interno del servidor"
        };
    }
};

export const obtenerResumen = async (ctx: Context) => {
    try {
        const url = ctx.request.url;
        const usuario_id = Number(url.searchParams.get("usuario_id"));
        const periodo = url.searchParams.get("periodo") as "mensual" | "semanal" | null;

        if (!usuario_id) {
            ctx.response.status = 400;
            ctx.response.body = { success: false, message: "Falta usuario_id" };
            return;
        }

        const transaccion = new Transaccion();
        const resumen = await transaccion.obtenerResumen(usuario_id, periodo);

        ctx.response.body = resumen;
    } catch (error) {
        console.error("Error en obtenerResumen:", error);
        ctx.response.status = 500;
        ctx.response.body = { success: false, message: "Error del servidor" };
    }
};