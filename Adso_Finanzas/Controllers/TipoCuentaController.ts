import { TipoCuenta } from "../Models/TipoCuentaModel.ts";
import { z } from "../Dependencies/Dependencias.ts";
import { Context } from "https://deno.land/x/oak@v17.1.3/mod.ts";

// Interfaz para el contexto con params
interface ContextWithParams extends Context {
    params: { [key: string]: string };
}

// Esquemas de validación con Zod
const tipoCuentaSchema = z.object({
    nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(50, "El nombre no puede tener más de 50 caracteres")
});

const tipoCuentaUpdateSchema = z.object({
    nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(50, "El nombre no puede tener más de 50 caracteres").optional()
});

// Obtener todos los tipos de cuenta (ruta pública - no requiere autenticación)
export const getTiposCuenta = async (ctx: Context) => {
    const { response } = ctx;
    
    try {
        const objTipoCuenta = new TipoCuenta();
        const tipos = await objTipoCuenta.obtenerTodosLosTipos();
        
        response.status = 200;
        response.body = {
            success: true,
            message: "Tipos de cuenta obtenidos correctamente",
            data: tipos
        };
    } catch (error) {
        console.error("Error al obtener tipos de cuenta:", error);
        response.status = 500;
        response.body = {
            success: false,
            message: "Error interno del servidor"
        };
    }
};

// Obtener un tipo de cuenta específico por ID
export const getTipoCuentaPorId = async (ctx: ContextWithParams) => {
    const { response, params } = ctx;
    
    try {
        const tipo_id = parseInt(params.id);

        if (!tipo_id) {
            response.status = 400;
            response.body = { success: false, message: "ID de tipo de cuenta inválido" };
            return;
        }

        const objTipoCuenta = new TipoCuenta();
        const tipo = await objTipoCuenta.obtenerTipoPorId(tipo_id);
        
        if (tipo) {
            response.status = 200;
            response.body = {
                success: true,
                message: "Tipo de cuenta obtenido correctamente",
                data: tipo
            };
        } else {
            response.status = 404;
            response.body = {
                success: false,
                message: "Tipo de cuenta no encontrado"
            };
        }
    } catch (error) {
        console.error("Error al obtener tipo de cuenta:", error);
        response.status = 500;
        response.body = {
            success: false,
            message: "Error interno del servidor"
        };
    }
};

// Crear un nuevo tipo de cuenta (requiere autenticación de administrador)
export const postTipoCuenta = async (ctx: Context) => {
    const { request, response } = ctx;
    
    try {
        if (!request.hasBody) {
            response.status = 400;
            response.body = { success: false, message: "Cuerpo vacío" };
            return;
        }

        const body = await request.body.json();

        // Validar datos con Zod
        const validacion = tipoCuentaSchema.safeParse(body);
        if (!validacion.success) {
            response.status = 400;
            response.body = {
                success: false,
                message: "Datos inválidos",
                errors: validacion.error.errors
            };
            return;
        }

        const objTipoCuenta = new TipoCuenta();
        const resultado = await objTipoCuenta.crearTipoCuenta(validacion.data);
        
        if (resultado.success) {
            response.status = 201;
            response.body = resultado;
        } else {
            response.status = 400;
            response.body = resultado;
        }
    } catch (error) {
        console.error("Error al crear tipo de cuenta:", error);
        response.status = 500;
        response.body = {
            success: false,
            message: "Error interno del servidor"
        };
    }
};

// Actualizar un tipo de cuenta existente
export const putTipoCuenta = async (ctx: ContextWithParams) => {
    const { request, response, params } = ctx;
    
    try {
        if (!request.hasBody) {
            response.status = 400;
            response.body = { success: false, message: "Cuerpo vacío" };
            return;
        }

        const body = await request.body.json();
        const tipo_id = parseInt(params.id);

        if (!tipo_id) {
            response.status = 400;
            response.body = { success: false, message: "ID de tipo de cuenta inválido" };
            return;
        }

        // Validar datos con Zod
        const validacion = tipoCuentaUpdateSchema.safeParse(body);
        if (!validacion.success) {
            response.status = 400;
            response.body = {
                success: false,
                message: "Datos inválidos",
                errors: validacion.error.errors
            };
            return;
        }

        const objTipoCuenta = new TipoCuenta();
        const resultado = await objTipoCuenta.actualizarTipoCuenta(tipo_id, validacion.data);
        
        if (resultado.success) {
            response.status = 200;
            response.body = resultado;
        } else {
            response.status = 400;
            response.body = resultado;
        }
    } catch (error) {
        console.error("Error al actualizar tipo de cuenta:", error);
        response.status = 500;
        response.body = {
            success: false,
            message: "Error interno del servidor"
        };
    }
};

// Eliminar un tipo de cuenta
export const deleteTipoCuenta = async (ctx: ContextWithParams) => {
    const { response, params } = ctx;
    
    try {
        const tipo_id = parseInt(params.id);

        if (!tipo_id) {
            response.status = 400;
            response.body = { success: false, message: "ID de tipo de cuenta inválido" };
            return;
        }

        const objTipoCuenta = new TipoCuenta();
        const resultado = await objTipoCuenta.eliminarTipoCuenta(tipo_id);
        
        if (resultado.success) {
            response.status = 200;
            response.body = resultado;
        } else {
            response.status = 400;
            response.body = resultado;
        }
    } catch (error) {
        console.error("Error al eliminar tipo de cuenta:", error);
        response.status = 500;
        response.body = {
            success: false,
            message: "Error interno del servidor"
        };
    }
};