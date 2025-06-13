import { conexion } from "./Conexion.ts";

interface TransaccionData {
    id?: number;
    usuario_id: number;
    cuenta_id: number;
    categoria_id: number;
    tipo: 'ingreso' | 'gasto';
    monto: number;
    fecha: string;
    descripcion?: string;
    cuenta_nombre?: string;
    categoria_nombre?: string;
}

interface CuentaData {
    id: number;
    usuario_id: number;
    nombre: string;
    tipo_cuenta_id: number;
    saldo: number;
    tipo_cuenta_nombre?: string;
}

interface CategoriaData {
    idCategoria: number;
    nombre: string;
    tipo: 'ingreso' | 'gasto';
}

interface ResultadoOperacion {
    success: boolean;
    message: string;
    id?: number;
}

interface FiltrosTransaccion {
    fecha_inicio?: string;
    fecha_fin?: string;
    categoria_id?: number;
    tipo?: 'ingreso' | 'gasto';
    cuenta_id?: number;
}

export class Transaccion {
    public _objTransaccion: TransaccionData | null;
    public _id: number | null;

    constructor(objTransaccion: TransaccionData | null = null, id: number | null = null) {
        this._objTransaccion = objTransaccion;
        this._id = id;
    }

    // Obtener todas las transacciones de un usuario
    public async obtenerTransaccionesPorUsuario(usuario_id: number): Promise<TransaccionData[]> {
        try {
            const query = `
                SELECT 
                    t.id,
                    t.cuenta_id,
                    c.nombre as cuenta_nombre,
                    t.categoria_id,
                    cat.nombre as categoria_nombre,
                    t.tipo,
                    t.monto,
                    t.fecha,
                    t.descripcion
                FROM transacciones t
                INNER JOIN cuentas c ON t.cuenta_id = c.id
                INNER JOIN categorias cat ON t.categoria_id = cat.idCategoria
                WHERE c.usuario_id = ?
                ORDER BY t.fecha DESC, t.id DESC
            `;
            
            const rows = await conexion.query(query, [usuario_id]);
            return rows as TransaccionData[];
        } catch (error) {
            console.error("Error al obtener transacciones:", error);
            return [];
        }
    }

    // Crear una nueva transacción
    public async crearTransaccion(transaccionData: TransaccionData): Promise<ResultadoOperacion> {
        try {
            // Verificar que la cuenta pertenece al usuario
            const cuentaExiste = await conexion.query(
                `SELECT id, saldo FROM cuentas WHERE id = ? AND usuario_id = ?`,
                [transaccionData.cuenta_id, transaccionData.usuario_id]
            );

            if (!cuentaExiste || cuentaExiste.length === 0) {
                return {
                    success: false,
                    message: "La cuenta no existe o no pertenece al usuario"
                };
            }

            // Verificar que la categoría existe y es del tipo correcto
            const categoriaExiste = await conexion.query(
                `SELECT idCategoria FROM categorias WHERE idCategoria = ? AND tipo = ?`,
                [transaccionData.categoria_id, transaccionData.tipo]
            );

            if (!categoriaExiste || categoriaExiste.length === 0) {
                return {
                    success: false,
                    message: "La categoría no existe o no corresponde al tipo de transacción"
                };
            }

            // Verificar saldo suficiente para gastos
            if (transaccionData.tipo === 'gasto') {
                const saldoActual = cuentaExiste[0].saldo;
                if (saldoActual < transaccionData.monto) {
                    return {
                        success: false,
                        message: "Saldo insuficiente en la cuenta"
                    };
                }
            }

            // Iniciar transacción
            await conexion.execute("START TRANSACTION");

            try {
                // Insertar la transacción
                const insertQuery = `
                    INSERT INTO transacciones (cuenta_id, categoria_id, tipo, monto, fecha, descripcion)
                    VALUES (?, ?, ?, ?, ?, ?)
                `;
                
                const result = await conexion.execute(insertQuery, [
                    transaccionData.cuenta_id,
                    transaccionData.categoria_id,
                    transaccionData.tipo,
                    transaccionData.monto,
                    transaccionData.fecha,
                    transaccionData.descripcion || null
                ]);

                // Actualizar el saldo de la cuenta
                const updateSaldoQuery = transaccionData.tipo === 'ingreso' 
                    ? `UPDATE cuentas SET saldo = saldo + ? WHERE id = ?`
                    : `UPDATE cuentas SET saldo = saldo - ? WHERE id = ?`;
                
                await conexion.execute(updateSaldoQuery, [
                    transaccionData.monto,
                    transaccionData.cuenta_id
                ]);

                await conexion.execute("COMMIT");
                
                return {
                    success: true,
                    message: "Transacción creada exitosamente",
                    id: result.lastInsertId as number
                };
            } catch (error) {
                await conexion.execute("ROLLBACK");
                throw error;
            }
        } catch (error) {
            console.error("Error al crear transacción:", error);
            return {
                success: false,
                message: "Error al crear la transacción"
            };
        }
    }

    // Actualizar una transacción existente
    public async actualizarTransaccion(id: number, transaccionData: TransaccionData): Promise<ResultadoOperacion> {
        try {
            // Obtener la transacción anterior para revertir el saldo
            const selectQuery = `
                SELECT t.*, c.usuario_id 
                FROM transacciones t
                INNER JOIN cuentas c ON t.cuenta_id = c.id
                WHERE t.id = ? AND c.usuario_id = ?
            `;
            const transaccionAnterior = await conexion.query(selectQuery, [id, transaccionData.usuario_id]);
            
            if (!transaccionAnterior || transaccionAnterior.length === 0) {
                return {
                    success: false,
                    message: "Transacción no encontrada"
                };
            }

            const transaccionVieja = transaccionAnterior[0] as TransaccionData;

            // Verificar que la nueva cuenta pertenece al usuario
            const cuentaExiste = await conexion.query(
                `SELECT id, saldo FROM cuentas WHERE id = ? AND usuario_id = ?`,
                [transaccionData.cuenta_id, transaccionData.usuario_id]
            );

            if (!cuentaExiste || cuentaExiste.length === 0) {
                return {
                    success: false,
                    message: "La cuenta no existe o no pertenece al usuario"
                };
            }

            // Verificar que la categoría existe y es del tipo correcto
            const categoriaExiste = await conexion.query(
                `SELECT idCategoria FROM categorias WHERE idCategoria = ? AND tipo = ?`,
                [transaccionData.categoria_id, transaccionData.tipo]
            );

            if (!categoriaExiste || categoriaExiste.length === 0) {
                return {
                    success: false,
                    message: "La categoría no existe o no corresponde al tipo de transacción"
                };
            }

            // Iniciar transacción
            await conexion.execute("START TRANSACTION");

            try {
                // Revertir el saldo de la cuenta anterior
                const revertSaldoQuery = transaccionVieja.tipo === 'ingreso' 
                    ? `UPDATE cuentas SET saldo = saldo - ? WHERE id = ?`
                    : `UPDATE cuentas SET saldo = saldo + ? WHERE id = ?`;
                
                await conexion.execute(revertSaldoQuery, [
                    transaccionVieja.monto,
                    transaccionVieja.cuenta_id
                ]);

                // Verificar saldo suficiente para gastos en la nueva cuenta
                if (transaccionData.tipo === 'gasto') {
                    const cuentaActualizada = await conexion.query(
                        `SELECT saldo FROM cuentas WHERE id = ?`,
                        [transaccionData.cuenta_id]
                    );
                    
                    if (cuentaActualizada[0].saldo < transaccionData.monto) {
                        await conexion.execute("ROLLBACK");
                        return {
                            success: false,
                            message: "Saldo insuficiente en la cuenta"
                        };
                    }
                }

                // Actualizar la transacción
                const updateQuery = `
                    UPDATE transacciones 
                    SET cuenta_id = ?, categoria_id = ?, tipo = ?, monto = ?, fecha = ?, descripcion = ?
                    WHERE id = ?
                `;
                
                await conexion.execute(updateQuery, [
                    transaccionData.cuenta_id,
                    transaccionData.categoria_id,
                    transaccionData.tipo,
                    transaccionData.monto,
                    transaccionData.fecha,
                    transaccionData.descripcion || null,
                    id
                ]);

                // Aplicar el nuevo saldo
                const updateSaldoQuery = transaccionData.tipo === 'ingreso' 
                    ? `UPDATE cuentas SET saldo = saldo + ? WHERE id = ?`
                    : `UPDATE cuentas SET saldo = saldo - ? WHERE id = ?`;
                
                await conexion.execute(updateSaldoQuery, [
                    transaccionData.monto,
                    transaccionData.cuenta_id
                ]);

                await conexion.execute("COMMIT");
                
                return {
                    success: true,
                    message: "Transacción actualizada exitosamente"
                };
            } catch (error) {
                await conexion.execute("ROLLBACK");
                throw error;
            }
        } catch (error) {
            console.error("Error al actualizar transacción:", error);
            return {
                success: false,
                message: "Error al actualizar la transacción"
            };
        }
    }

    // Eliminar una transacción
    public async eliminarTransaccion(id: number, usuario_id: number): Promise<ResultadoOperacion> {
        try {
            // Obtener la transacción para revertir el saldo
            const selectQuery = `
                SELECT t.*, c.usuario_id 
                FROM transacciones t
                INNER JOIN cuentas c ON t.cuenta_id = c.id
                WHERE t.id = ? AND c.usuario_id = ?
            `;
            const transaccion = await conexion.query(selectQuery, [id, usuario_id]);
            
            if (!transaccion || transaccion.length === 0) {
                return {
                    success: false,
                    message: "Transacción no encontrada"
                };
            }

            const transaccionData = transaccion[0] as TransaccionData;

            // Iniciar transacción
            await conexion.execute("START TRANSACTION");

            try {
                // Revertir el saldo de la cuenta
                const revertSaldoQuery = transaccionData.tipo === 'ingreso' 
                    ? `UPDATE cuentas SET saldo = saldo - ? WHERE id = ?`
                    : `UPDATE cuentas SET saldo = saldo + ? WHERE id = ?`;
                
                await conexion.execute(revertSaldoQuery, [
                    transaccionData.monto,
                    transaccionData.cuenta_id
                ]);

                // Eliminar la transacción
                const deleteQuery = `DELETE FROM transacciones WHERE id = ?`;
                await conexion.execute(deleteQuery, [id]);

                await conexion.execute("COMMIT");
                
                return {
                    success: true,
                    message: "Transacción eliminada exitosamente"
                };
            } catch (error) {
                await conexion.execute("ROLLBACK");
                throw error;
            }
        } catch (error) {
            console.error("Error al eliminar transacción:", error);
            return {
                success: false,
                message: "Error al eliminar la transacción"
            };
        }
    }

    // Obtener cuentas de un usuario
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

    // Obtener categorías
    public async obtenerCategoriasPorUsuario(usuario_id: number, tipo?: 'ingreso' | 'gasto'): Promise<CategoriaData[]> {
        try {
            let query = `SELECT idCategoria, nombre, tipo FROM categorias`;
            const params: string[] = [];
            
            if (tipo) {
                query += ` WHERE tipo = ?`;
                params.push(tipo);
            }
            
            query += ` ORDER BY nombre`;
            
            const rows = await conexion.query(query, params);
            return rows as CategoriaData[];
        } catch (error) {
            console.error("Error al obtener categorías:", error);
            return [];
        }
    }

    // Obtener transacciones filtradas
    public async obtenerTransaccionesFiltradas(
        usuario_id: number, 
        filtros: FiltrosTransaccion
    ): Promise<TransaccionData[]> {
        try {
            let query = `
                SELECT 
                    t.id,
                    t.cuenta_id,
                    c.nombre as cuenta_nombre,
                    t.categoria_id,
                    cat.nombre as categoria_nombre,
                    t.tipo,
                    t.monto,
                    t.fecha,
                    t.descripcion
                FROM transacciones t
                INNER JOIN cuentas c ON t.cuenta_id = c.id
                INNER JOIN categorias cat ON t.categoria_id = cat.idCategoria
                WHERE c.usuario_id = ?
            `;
            
            const params: (number | string)[] = [usuario_id];

            if (filtros.fecha_inicio) {
                query += ` AND t.fecha >= ?`;
                params.push(filtros.fecha_inicio);
            }

            if (filtros.fecha_fin) {
                query += ` AND t.fecha <= ?`;
                params.push(filtros.fecha_fin);
            }

            if (filtros.categoria_id) {
                query += ` AND t.categoria_id = ?`;
                params.push(filtros.categoria_id);
            }

            if (filtros.tipo) {
                query += ` AND t.tipo = ?`;
                params.push(filtros.tipo);
            }

            if (filtros.cuenta_id) {
                query += ` AND t.cuenta_id = ?`;
                params.push(filtros.cuenta_id);
            }

            query += ` ORDER BY t.fecha DESC, t.id DESC`;
            
            const rows = await conexion.query(query, params);
            return rows as TransaccionData[];
        } catch (error) {
            console.error("Error al obtener transacciones filtradas:", error);
            return [];
        }
    }

    public async obtenerResumen(usuario_id: number, periodo: "mensual" | "semanal" | null = null) {
    const query = `
        SELECT 
            ${periodo === "semanal" 
                ? `YEARWEEK(t.fecha, 1) AS periodo`
                : periodo === "mensual"
                    ? `DATE_FORMAT(t.fecha, '%Y-%m') AS periodo`
                    : `NULL AS periodo`
            },
            cat.nombre AS categoria,
            t.tipo,
            SUM(t.monto) AS total
        FROM transacciones t
        JOIN categorias cat ON t.categoria_id = cat.id
        WHERE t.usuario_id = ?
        GROUP BY periodo, categoria, t.tipo
        ORDER BY periodo DESC;
    `;

    const rows = await conexion.query(query, [usuario_id]);
    return rows;
}

}