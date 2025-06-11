import { conexion } from "./Conexion.ts";

interface TipoCuentaData {
    id?: number;
    nombre: string;
}

interface ResultadoOperacion {
    success: boolean;
    message: string;
    id?: number;
}

export class TipoCuenta {
    public _objTipoCuenta: TipoCuentaData | null;
    public _id: number | null;

    constructor(objTipoCuenta: TipoCuentaData | null = null, id: number | null = null) {
        this._objTipoCuenta = objTipoCuenta;
        this._id = id;
    }

    // Obtener todos los tipos de cuenta
    public async obtenerTodosLosTipos(): Promise<TipoCuentaData[]> {
        try {
            const query = `SELECT * FROM tipo_cuenta ORDER BY nombre`;
            const rows = await conexion.query(query);
            return rows as TipoCuentaData[];
        } catch (error) {
            console.error("Error al obtener tipos de cuenta:", error);
            return [];
        }
    }

    // Obtener un tipo de cuenta por ID
    public async obtenerTipoPorId(id: number): Promise<TipoCuentaData | null> {
        try {
            const query = `SELECT * FROM tipo_cuenta WHERE id = ?`;
            const result = await conexion.query(query, [id]);
            
            if (result && result.length > 0) {
                return result[0] as TipoCuentaData;
            }
            return null;
        } catch (error) {
            console.error("Error al obtener tipo de cuenta por ID:", error);
            return null;
        }
    }

    // Crear un nuevo tipo de cuenta
    public async crearTipoCuenta(tipoCuentaData: TipoCuentaData): Promise<ResultadoOperacion> {
        try {
            // Verificar que no exista un tipo con el mismo nombre
            const tipoExistente = await conexion.query(
                `SELECT id FROM tipo_cuenta WHERE nombre = ?`,
                [tipoCuentaData.nombre]
            );

            if (tipoExistente && tipoExistente.length > 0) {
                return {
                    success: false,
                    message: "Ya existe un tipo de cuenta con ese nombre"
                };
            }

            const insertQuery = `INSERT INTO tipo_cuenta (nombre) VALUES (?)`;
            const result = await conexion.query(insertQuery, [tipoCuentaData.nombre]);
            
            return {
                success: true,
                message: "Tipo de cuenta creado exitosamente",
                id: result.lastInsertId as number
            };
        } catch (error) {
            console.error("Error al crear tipo de cuenta:", error);
            return {
                success: false,
                message: "Error al crear el tipo de cuenta"
            };
        }
    }

    // Actualizar un tipo de cuenta existente
    public async actualizarTipoCuenta(id: number, tipoCuentaData: Partial<TipoCuentaData>): Promise<ResultadoOperacion> {
        try {
            // Verificar que el tipo de cuenta existe
            const tipoExistente = await conexion.query(
                `SELECT id FROM tipo_cuenta WHERE id = ?`,
                [id]
            );

            if (!tipoExistente || tipoExistente.length === 0) {
                return {
                    success: false,
                    message: "Tipo de cuenta no encontrado"
                };
            }

            // Si se está cambiando el nombre, verificar que no exista otro con ese nombre
            if (tipoCuentaData.nombre) {
                const nombreDuplicado = await conexion.query(
                    `SELECT id FROM tipo_cuenta WHERE nombre = ? AND id != ?`,
                    [tipoCuentaData.nombre, id]
                );

                if (nombreDuplicado && nombreDuplicado.length > 0) {
                    return {
                        success: false,
                        message: "Ya existe un tipo de cuenta con ese nombre"
                    };
                }
            }

            if (!tipoCuentaData.nombre) {
                return {
                    success: false,
                    message: "No hay datos para actualizar"
                };
            }

            const updateQuery = `UPDATE tipo_cuenta SET nombre = ? WHERE id = ?`;
            await conexion.query(updateQuery, [tipoCuentaData.nombre, id]);
            
            return {
                success: true,
                message: "Tipo de cuenta actualizado exitosamente"
            };
        } catch (error) {
            console.error("Error al actualizar tipo de cuenta:", error);
            return {
                success: false,
                message: "Error al actualizar el tipo de cuenta"
            };
        }
    }

    // Eliminar un tipo de cuenta
    public async eliminarTipoCuenta(id: number): Promise<ResultadoOperacion> {
        try {
            // Verificar que no tenga cuentas asociadas
            const cuentasAsociadas = await conexion.query(
                `SELECT id FROM cuentas WHERE tipo_cuenta_id = ? LIMIT 1`,
                [id]
            );

            if (cuentasAsociadas && cuentasAsociadas.length > 0) {
                return {
                    success: false,
                    message: "No puedes eliminar un tipo de cuenta que tiene cuentas asociadas"
                };
            }

            const deleteQuery = `DELETE FROM tipo_cuenta WHERE id = ?`;
            const result = await conexion.query(deleteQuery, [id]);
            
            if (result.affectedRows && result.affectedRows > 0) {
                return {
                    success: true,
                    message: "Tipo de cuenta eliminado exitosamente"
                };
            } else {
                return {
                    success: false,
                    message: "Tipo de cuenta no encontrado"
                };
            }
        } catch (error) {
            console.error("Error al eliminar tipo de cuenta:", error);
            return {
                success: false,
                message: "Error al eliminar el tipo de cuenta"
            };
        }
    }

    // Verificar si un tipo de cuenta existe
    public async existeTipoCuenta(id: number): Promise<boolean> {
        try {
            const result = await conexion.query(
                `SELECT id FROM tipo_cuenta WHERE id = ?`,
                [id]
            );
            return result && result.length > 0;
        } catch (error) {
            console.error("Error al verificar tipo de cuenta:", error);
            return false;
        }
    }
}