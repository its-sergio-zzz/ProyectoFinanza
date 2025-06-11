import { conexion } from "./Conexion.ts";
import { TipoCuenta } from "./TipoCuentaModel.ts";

interface CuentaData {
    id?: number;
    usuario_id: number;
    nombre: string;
    tipo_cuenta_id: number;
    saldo: number;
    // Campos adicionales para mostrar información del tipo
    tipo_cuenta_nombre?: string;
}

interface ResultadoOperacion {
    success: boolean;
    message: string;
    id?: number;
}

export class Cuenta {
    public _objCuenta: CuentaData | null;
    public _id: number | null;

    constructor(objCuenta: CuentaData | null = null, id: number | null = null) {
        this._objCuenta = objCuenta;
        this._id = id;
    }

    // Obtener todas las cuentas de un usuario con información del tipo
    public async obtenerCuentasPorUsuario(usuario_id: number): Promise<CuentaData[]> {
        try {
            const query = `
                SELECT 
                    c.id,
                    c.usuario_id,
                    c.nombre,
                    c.tipo_cuenta_id,
                    c.saldo,
                    tc.nombre as tipo_cuenta_nombre
                FROM cuentas c
                INNER JOIN tipo_cuenta tc ON c.tipo_cuenta_id = tc.id
                WHERE c.usuario_id = ?
                ORDER BY c.nombre
            `;
            const rows = await conexion.query(query, [usuario_id]);
            return rows as CuentaData[];
        } catch (error) {
            console.error("Error al obtener cuentas:", error);
            return [];
        }
    }

    // Crear una nueva cuenta
    public async crearCuenta(cuentaData: CuentaData): Promise<ResultadoOperacion> {
        try {
            // Verificar que el tipo de cuenta existe
            const objTipoCuenta = new TipoCuenta();
            const tipoExiste = await objTipoCuenta.existeTipoCuenta(cuentaData.tipo_cuenta_id);
            
            if (!tipoExiste) {
                return {
                    success: false,
                    message: "El tipo de cuenta especificado no existe"
                };
            }

            // Verificar que el usuario no tenga una cuenta con el mismo nombre
            const cuentaExistente = await conexion.query(
                `SELECT id FROM cuentas WHERE usuario_id = ? AND nombre = ?`,
                [cuentaData.usuario_id, cuentaData.nombre]
            );

            if (cuentaExistente && cuentaExistente.length > 0) {
                return {
                    success: false,
                    message: "Ya tienes una cuenta con ese nombre"
                };
            }

            const insertQuery = `
                INSERT INTO cuentas (usuario_id, nombre, tipo_cuenta_id, saldo)
                VALUES (?, ?, ?, ?)
            `;
            
            const result = await conexion.query(insertQuery, [
                cuentaData.usuario_id,
                cuentaData.nombre,
                cuentaData.tipo_cuenta_id,
                cuentaData.saldo || 0
            ]);
            
            return {
                success: true,
                message: "Cuenta creada exitosamente",
                id: result.lastInsertId as number
            };
        } catch (error) {
            console.error("Error al crear cuenta:", error);
            return {
                success: false,
                message: "Error al crear la cuenta"
            };
        }
    }

    // Actualizar una cuenta existente
    public async actualizarCuenta(id: number, cuentaData: Partial<CuentaData>): Promise<ResultadoOperacion> {
        try {
            // Verificar que la cuenta pertenece al usuario
            const cuentaExistente = await conexion.query(
                `SELECT id FROM cuentas WHERE id = ? AND usuario_id = ?`,
                [id, cuentaData.usuario_id]
            );

            if (!cuentaExistente || cuentaExistente.length === 0) {
                return {
                    success: false,
                    message: "Cuenta no encontrada"
                };
            }

            // Si se está cambiando el tipo, verificar que existe
            if (cuentaData.tipo_cuenta_id) {
                const objTipoCuenta = new TipoCuenta();
                const tipoExiste = await objTipoCuenta.existeTipoCuenta(cuentaData.tipo_cuenta_id);
                
                if (!tipoExiste) {
                    return {
                        success: false,
                        message: "El tipo de cuenta especificado no existe"
                    };
                }
            }

            // Si se está cambiando el nombre, verificar que no exista otra cuenta con ese nombre
            if (cuentaData.nombre) {
                const nombreDuplicado = await conexion.query(
                    `SELECT id FROM cuentas WHERE usuario_id = ? AND nombre = ? AND id != ?`,
                    [cuentaData.usuario_id, cuentaData.nombre, id]
                );

                if (nombreDuplicado && nombreDuplicado.length > 0) {
                    return {
                        success: false,
                        message: "Ya tienes una cuenta con ese nombre"
                    };
                }
            }

            const campos = [];
            const valores = [];

            if (cuentaData.nombre !== undefined) {
                campos.push('nombre = ?');
                valores.push(cuentaData.nombre);
            }

            if (cuentaData.tipo_cuenta_id !== undefined) {
                campos.push('tipo_cuenta_id = ?');
                valores.push(cuentaData.tipo_cuenta_id);
            }

            if (cuentaData.saldo !== undefined) {
                campos.push('saldo = ?');
                valores.push(cuentaData.saldo);
            }

            if (campos.length === 0) {
                return {
                    success: false,
                    message: "No hay datos para actualizar"
                };
            }

            valores.push(id);
            const updateQuery = `UPDATE cuentas SET ${campos.join(', ')} WHERE id = ?`;
            
            await conexion.query(updateQuery, valores);
            
            return {
                success: true,
                message: "Cuenta actualizada exitosamente"
            };
        } catch (error) {
            console.error("Error al actualizar cuenta:", error);
            return {
                success: false,
                message: "Error al actualizar la cuenta"
            };
        }
    }

    // Eliminar una cuenta
    public async eliminarCuenta(id: number, usuario_id: number): Promise<ResultadoOperacion> {
        try {
            // Verificar que la cuenta pertenece al usuario
            const cuentaExistente = await conexion.query(
                `SELECT id FROM cuentas WHERE id = ? AND usuario_id = ?`,
                [id, usuario_id]
            );

            if (!cuentaExistente || cuentaExistente.length === 0) {
                return {
                    success: false,
                    message: "Cuenta no encontrada"
                };
            }

            // Verificar que no tenga transacciones asociadas
            const transaccionesExistentes = await conexion.query(
                `SELECT id FROM transacciones WHERE cuenta_id = ? LIMIT 1`,
                [id]
            );

            if (transaccionesExistentes && transaccionesExistentes.length > 0) {
                return {
                    success: false,
                    message: "No puedes eliminar una cuenta que tiene transacciones asociadas"
                };
            }

            const deleteQuery = `DELETE FROM cuentas WHERE id = ? AND usuario_id = ?`;
            await conexion.query(deleteQuery, [id, usuario_id]);
            
            return {
                success: true,
                message: "Cuenta eliminada exitosamente"
            };
        } catch (error) {
            console.error("Error al eliminar cuenta:", error);
            return {
                success: false,
                message: "Error al eliminar la cuenta"
            };
        }
    }

    // Obtener una cuenta específica por ID y usuario con información del tipo
    public async obtenerCuentaPorId(id: number, usuario_id: number): Promise<CuentaData | null> {
        try {
            const query = `
                SELECT 
                    c.id,
                    c.usuario_id,
                    c.nombre,
                    c.tipo_cuenta_id,
                    c.saldo,
                    tc.nombre as tipo_cuenta_nombre
                FROM cuentas c
                INNER JOIN tipo_cuenta tc ON c.tipo_cuenta_id = tc.id
                WHERE c.id = ? AND c.usuario_id = ?
            `;
            const result = await conexion.query(query, [id, usuario_id]);
            
            if (result && result.length > 0) {
                return result[0] as CuentaData;
            }
            return null;
        } catch (error) {
            console.error("Error al obtener cuenta por ID:", error);
            return null;
        }
    }

    // Actualizar saldo de una cuenta (para transacciones)
    public async actualizarSaldo(id: number, monto: number, tipo: 'suma' | 'resta'): Promise<ResultadoOperacion> {
        try {
            const operacion = tipo === 'suma' ? '+' : '-';
            const updateQuery = `UPDATE cuentas SET saldo = saldo ${operacion} ? WHERE id = ?`;
            
            await conexion.query(updateQuery, [Math.abs(monto), id]);
            
            return {
                success: true,
                message: `Saldo ${tipo === 'suma' ? 'incrementado' : 'decrementado'} exitosamente`
            };
        } catch (error) {
            console.error("Error al actualizar saldo:", error);
            return {
                success: false,
                message: "Error al actualizar el saldo"
            };
        }
    }

    // Obtener resumen financiero del usuario
    public async obtenerResumenFinanciero(usuario_id: number): Promise<{
        total_cuentas: number;
        saldo_total: number;
        cuentas_por_tipo: Array<{tipo_nombre: string, cantidad: number, saldo_total: number}>;
    }> {
        try {
            // Total de cuentas y saldo
            const resumenGeneral = await conexion.query(`
                SELECT 
                    COUNT(*) as total_cuentas,
                    COALESCE(SUM(saldo), 0) as saldo_total
                FROM cuentas 
                WHERE usuario_id = ?
            `, [usuario_id]);

            // Resumen por tipo de cuenta
            const resumenPorTipo = await conexion.query(`
                SELECT 
                    tc.nombre as tipo_nombre,
                    COUNT(*) as cantidad,
                    COALESCE(SUM(c.saldo), 0) as saldo_total
                FROM cuentas c
                INNER JOIN tipo_cuenta tc ON c.tipo_cuenta_id = tc.id
                WHERE c.usuario_id = ?
                GROUP BY tc.id, tc.nombre
                ORDER BY saldo_total DESC
            `, [usuario_id]);

            return {
                total_cuentas: resumenGeneral[0]?.total_cuentas || 0,
                saldo_total: resumenGeneral[0]?.saldo_total || 0,
                cuentas_por_tipo: resumenPorTipo as Array<{tipo_nombre: string, cantidad: number, saldo_total: number}>
            };
        } catch (error) {
            console.error("Error al obtener resumen financiero:", error);
            return {
                total_cuentas: 0,
                saldo_total: 0,
                cuentas_por_tipo: []
            };
        }
    }
}