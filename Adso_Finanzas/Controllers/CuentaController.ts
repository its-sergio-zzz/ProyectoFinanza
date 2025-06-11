import { Cuenta } from "../Models/CuentaModel.ts";
import { z } from "../Dependencies/Dependencias.ts";
import { Context } from "https://deno.land/x/oak@v17.1.3/mod.ts";

// Interfaz para el contexto con params
interface ContextWithParams extends Context {
    params: { [key: string]: string };
}

// Esquemas de validación con Zod
const cuentaSchema = z.object({
    nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100, "El nombre no puede tener más de 100 caracteres"),
    tipo: z.enum(['efectivo', 'bancaria', 'tarjeta', 'digital'], {
        errorMap: () => ({ message: "El tipo debe ser: efectivo, bancaria, tarjeta o digital" })
    }),
    saldo: z.number().min(0, "El saldo no puede ser negativo").optional().default(0)
});

const cuentaUpdateSchema = z.object({
    nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100, "El nombre no puede tener más de 100 caracteres").optional(),
    tipo: z.enum(['efectivo', 'bancaria', 'tarjeta', 'digital']).optional(),
    saldo: z.number().min(0, "El saldo no puede ser negativo").optional()
});

// Obtener todas las cuentas del usuario autenticado
export const getCuentas = async (ctx: Context) => {
    const { response } = ctx;
    
    try {
        const usuario_id = parseInt(ctx.state.user.sub);
        const objCuenta = new Cuenta();
        
        const cuentas = await objCuenta.obtenerCuentasPorUsuario(usuario_id);
        
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

// Obtener una cuenta específica por ID
export const getCuentaPorId = async (ctx: ContextWithParams) => {
    const { response, params } = ctx;
    
    try {
        const usuario_id = parseInt(ctx.state.user.sub);
        const cuenta_id = parseInt(params.id);

        if (!cuenta_id) {
            response.status = 400;
            response.body = { success: false, message: "ID de cuenta inválido" };
            return;
        }

        const objCuenta = new Cuenta();
        const cuenta = await objCuenta.obtenerCuentaPorId(cuenta_id, usuario_id);
        
        if (cuenta) {
            response.status = 200;
            response.body = {
                success: true,
                message: "Cuenta obtenida correctamente",
                data: cuenta
            };
        } else {
            response.status = 404;
            response.body = {
                success: false,
                message: "Cuenta no encontrada"
            };
        }
    } catch (error) {
        console.error("Error al obtener cuenta:", error);
        response.status = 500;
        response.body = {
            success: false,
            message: "Error interno del servidor"
        };
    }
};

// Crear una nueva cuenta
export const postCuenta = async (ctx: Context) => {
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
        const validacion = cuentaSchema.safeParse(body);
        if (!validacion.success) {
            response.status = 400;
            response.body = {
                success: false,
                message: "Datos inválidos",
                errors: validacion.error.errors
            };
            return;
        }

        const cuentaData = {
            ...validacion.data,
            usuario_id
        };

        const objCuenta = new Cuenta();
        const resultado = await objCuenta.crearCuenta(cuentaData);
        
        if (resultado.success) {
            response.status = 201;
            response.body = resultado;
        } else {
            response.status = 400;
            response.body = resultado;
        }
    } catch (error) {
        console.error("Error al crear cuenta:", error);
        response.status = 500;
        response.body = {
            success: false,
            message: "Error interno del servidor"
        };
    }
};

// Actualizar una cuenta existente
export const putCuenta = async (ctx: ContextWithParams) => {
    const { request, response, params } = ctx;
    
    try {
        if (!request.hasBody) {
            response.status = 400;
            response.body = { success: false, message: "Cuerpo vacío" };
            return;
        }

        const body = await request.body.json();
        const usuario_id = parseInt(ctx.state.user.sub);
        const cuenta_id = parseInt(params.id);

        if (!cuenta_id) {
            response.status = 400;
            response.body = { success: false, message: "ID de cuenta inválido" };
            return;
        }

        // Validar datos con Zod
        const validacion = cuentaUpdateSchema.safeParse(body);
        if (!validacion.success) {
            response.status = 400;
            response.body = {
                success: false,
                message: "Datos inválidos",
                errors: validacion.error.errors
            };
            return;
        }

        const cuentaData = {
            ...validacion.data,
            usuario_id
        };

        const objCuenta = new Cuenta();
        const resultado = await objCuenta.actualizarCuenta(cuenta_id, cuentaData);
        
        if (resultado.success) {
            response.status = 200;
            response.body = resultado;
        } else {
            response.status = 400;
            response.body = resultado;
        }
    } catch (error) {
        console.error("Error al actualizar cuenta:", error);
        response.status = 500;
        response.body = {
            success: false,
            message: "Error interno del servidor"
        };
    }
};

// Eliminar una cuenta
export const deleteCuenta = async (ctx: ContextWithParams) => {
    const { response, params } = ctx;
    
    try {
        const usuario_id = parseInt(ctx.state.user.sub);
        const cuenta_id = parseInt(params.id);

        if (!cuenta_id) {
            response.status = 400;
            response.body = { success: false, message: "ID de cuenta inválido" };
            return;
        }

        const objCuenta = new Cuenta();
        const resultado = await objCuenta.eliminarCuenta(cuenta_id, usuario_id);
        
        if (resultado.success) {
            response.status = 200;
            response.body = resultado;
        } else {
            response.status = 400;
            response.body = resultado;
        }
    } catch (error) {
        console.error("Error al eliminar cuenta:", error);
        response.status = 500;
        response.body = {
            success: false,
            message: "Error interno del servidor"
        };
    }
};

// Obtener resumen financiero del usuario
export const getResumenFinanciero = async (ctx: Context) => {
    const { response } = ctx;
    
    try {
        const usuario_id = parseInt(ctx.state.user.sub);
        const objCuenta = new Cuenta();
        
        const resumen = await objCuenta.obtenerResumenFinanciero(usuario_id);
        
        response.status = 200;
        response.body = {
            success: true,
            message: "Resumen financiero obtenido correctamente",
            data: resumen
        };
    } catch (error) {
        console.error("Error al obtener resumen financiero:", error);
        response.status = 500;
        response.body = {
            success: false,
            message: "Error interno del servidor"
        };
    }
};