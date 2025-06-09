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
    tipo: string;
    saldo: number;
}

interface CategoriaData {
    id: number;
    usuario_id: number;
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
        const query = `
            SELECT 
                t.id,
                t.usuario_id,
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
            INNER JOIN categorias cat ON t.categoria_id = cat.id
            WHERE t.usuario_id = ?
            ORDER BY t.fecha DESC, t.id DESC
        `;
        
        const rows = await conexion.query(query, [usuario_id]);
        return rows as TransaccionData[];
    }

    // Crear una nueva transacción
    public async crearTransaccion(transaccionData: TransaccionData): Promise<ResultadoOperacion> {
        try {
            // Insertar la transacción
            const insertQuery = `
                INSERT INTO transacciones (usuario_id, cuenta_id, categoria_id, tipo, monto, fecha, descripcion)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            
            const result = await conexion.query(insertQuery, [
                transaccionData.usuario_id,
                transaccionData.cuenta_id,
                transaccionData.categoria_id,
                transaccionData.tipo,
                transaccionData.monto,
                transaccionData.fecha,
                transaccionData.descripcion || null
            ]);

            // Actualizar el saldo de la cuenta
            const updateSaldoQuery = transaccionData.tipo === 'ingreso' 
                ? `UPDATE cuentas SET saldo = saldo + ? WHERE id = ? AND usuario_id = ?`
                : `UPDATE cuentas SET saldo = saldo - ? WHERE id = ? AND usuario_id = ?`;
            
            await conexion.query(updateSaldoQuery, [
                transaccionData.monto,
                transaccionData.cuenta_id,
                transaccionData.usuario_id
            ]);
            
            return {
                success: true,
                message: "Transacción creada exitosamente",
                id: result.lastInsertId as number
            };
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
            const selectQuery = `SELECT * FROM transacciones WHERE id = ? AND usuario_id = ?`;
            const transaccionAnterior = await conexion.query(selectQuery, [id, transaccionData.usuario_id]);
            
            if (!transaccionAnterior || transaccionAnterior.length === 0) {
                return {
                    success: false,
                    message: "Transacción no encontrada"
                };
            }

            const transaccionVieja = transaccionAnterior[0] as TransaccionData;

            // Revertir el saldo de la cuenta (transacción anterior)
            const revertSaldoQuery = transaccionVieja.tipo === 'ingreso' 
                ? `UPDATE cuentas SET saldo = saldo - ? WHERE id = ? AND usuario_id = ?`
                : `UPDATE cuentas SET saldo = saldo + ? WHERE id = ? AND usuario_id = ?`;
            
            await conexion.query(revertSaldoQuery, [
                transaccionVieja.monto,
                transaccionVieja.cuenta_id,
                transaccionData.usuario_id
            ]);

            // Actualizar la transacción
            const updateQuery = `
                UPDATE transacciones 
                SET cuenta_id = ?, categoria_id = ?, tipo = ?, monto = ?, fecha = ?, descripcion = ?
                WHERE id = ? AND usuario_id = ?
            `;
            
            await conexion.query(updateQuery, [
                transaccionData.cuenta_id,
                transaccionData.categoria_id,
                transaccionData.tipo,
                transaccionData.monto,
                transaccionData.fecha,
                transaccionData.descripcion || null,
                id,
                transaccionData.usuario_id
            ]);

            // Aplicar el nuevo saldo
            const updateSaldoQuery = transaccionData.tipo === 'ingreso' 
                ? `UPDATE cuentas SET saldo = saldo + ? WHERE id = ? AND usuario_id = ?`
                : `UPDATE cuentas SET saldo = saldo - ? WHERE id = ? AND usuario_id = ?`;
            
            await conexion.query(updateSaldoQuery, [
                transaccionData.monto,
                transaccionData.cuenta_id,
                transaccionData.usuario_id
            ]);
            
            return {
                success: true,
                message: "Transacción actualizada exitosamente"
            };
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
            const selectQuery = `SELECT * FROM transacciones WHERE id = ? AND usuario_id = ?`;
            const transaccion = await conexion.query(selectQuery, [id, usuario_id]);
            
            if (!transaccion || transaccion.length === 0) {
                return {
                    success: false,
                    message: "Transacción no encontrada"
                };
            }

            const transaccionData = transaccion[0] as TransaccionData;

            // Revertir el saldo de la cuenta
            const revertSaldoQuery = transaccionData.tipo === 'ingreso' 
                ? `UPDATE cuentas SET saldo = saldo - ? WHERE id = ? AND usuario_id = ?`
                : `UPDATE cuentas SET saldo = saldo + ? WHERE id = ? AND usuario_id = ?`;
            
            await conexion.query(revertSaldoQuery, [
                transaccionData.monto,
                transaccionData.cuenta_id,
                usuario_id
            ]);

            // Eliminar la transacción
            const deleteQuery = `DELETE FROM transacciones WHERE id = ? AND usuario_id = ?`;
            await conexion.query(deleteQuery, [id, usuario_id]);
            
            return {
                success: true,
                message: "Transacción eliminada exitosamente"
            };
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
        const query = `SELECT * FROM cuentas WHERE usuario_id = ? ORDER BY nombre`;
        const rows = await conexion.query(query, [usuario_id]);
        return rows as CuentaData[];
    }

    // Obtener categorías de un usuario
    public async obtenerCategoriasPorUsuario(usuario_id: number, tipo?: 'ingreso' | 'gasto'): Promise<CategoriaData[]> {
        let query = `SELECT * FROM categorias WHERE usuario_id = ?`;
        const params: (number | string)[] = [usuario_id];
        
        if (tipo) {
            query += ` AND tipo = ?`;
            params.push(tipo);
        }
        
        query += ` ORDER BY nombre`;
        
        const rows = await conexion.query(query, params);
        return rows as CategoriaData[];
    }

    // Obtener transacciones filtradas
    public async obtenerTransaccionesFiltradas(
        usuario_id: number, 
        filtros: FiltrosTransaccion
    ): Promise<TransaccionData[]> {
        let query = `
            SELECT 
                t.id,
                t.usuario_id,
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
            INNER JOIN categorias cat ON t.categoria_id = cat.id
            WHERE t.usuario_id = ?
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
    }
}