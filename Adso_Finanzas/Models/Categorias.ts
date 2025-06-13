import { conexion } from "./Conexion.ts";
import { z } from "../Dependencies/Dependencias.ts";

type TipoCategoria = 'ingreso' | 'gasto';

interface CategoriaData {
    idCategoria: number | null;
    nombre: string;
    tipo: TipoCategoria;
}

export class Categoria {

    public _objCategoria: CategoriaData | null;
    public _idCategoria: number | null;

    constructor(objCategoria: CategoriaData | null = null, idCategoria: number | null = null ){
        this._objCategoria = objCategoria;
        this._idCategoria = idCategoria;
    }

    public async SeleccionarCategoria(): Promise<CategoriaData[]> {
        try {
            const { rows } = await conexion.execute(`SELECT idCategoria, nombre, tipo FROM categorias ORDER BY nombre`);
            return rows as CategoriaData[];
        } catch (error) {
            console.error("Error al obtener categorías:", error);
            return [];
        }
    }

    public async InsertarCategoria(): Promise<{ success: boolean; msg: string; categoria?: CategoriaData }> {
        try {
            if (!this._objCategoria) {
                return { success: false, msg: "No se ha enviado ninguna categoría" };
            }

            const { nombre, tipo } = this._objCategoria;
            if (!nombre || !tipo) {
                return { success: false, msg: "Faltan campos requeridos para insertar la categoría." };
            }

            // Verificar si ya existe una categoría con el mismo nombre y tipo
            const { rows: categoriaExistente } = await conexion.execute(
                `SELECT idCategoria FROM categorias WHERE nombre = ? AND tipo = ?`, 
                [nombre, tipo]
            );

            if (categoriaExistente && categoriaExistente.length > 0) {
                return { success: false, msg: "Ya existe una categoría con ese nombre y tipo" };
            }

            const result = await conexion.execute(
                `INSERT INTO categorias (nombre, tipo) VALUES (?, ?)`, 
                [nombre, tipo]
            );
            
            if (result && result.affectedRows && result.affectedRows > 0) {
                const { rows: nuevaCategoria } = await conexion.execute(
                    `SELECT idCategoria, nombre, tipo FROM categorias WHERE idCategoria = ?`, 
                    [result.lastInsertId]
                );
                
                return { 
                    success: true, 
                    msg: "Categoría creada correctamente.", 
                    categoria: nuevaCategoria[0] as CategoriaData 
                };
            } else {
                return { success: false, msg: "Error, no fue posible registrar la categoría" };
            }
        } catch (error) {
            console.error("Error al insertar categoría:", error);
            return { success: false, msg: `Error interno del servidor: ${error}` };
        }
    }

    public async ActualizarCategoria(): Promise<{ success: boolean, msg: string, categoria?: CategoriaData }> {
        try {
            if (!this._objCategoria || !this._idCategoria) {
                return { success: false, msg: "No se ha enviado ninguna categoría o ID" };
            }
            
            const { nombre, tipo } = this._objCategoria;
            if (!nombre || !tipo) {
                return { success: false, msg: "Faltan campos requeridos para actualizar la categoría" };
            }

            // Verificar si la categoría existe
            const { rows: categoriaExistente } = await conexion.execute(
                `SELECT idCategoria FROM categorias WHERE idCategoria = ?`, 
                [this._idCategoria]
            );

            if (!categoriaExistente || categoriaExistente.length === 0) {
                return { success: false, msg: "La categoría no existe" };
            }

            // Verificar si ya existe otra categoría con el mismo nombre y tipo
            const { rows: categoriaConMismoNombre } = await conexion.execute(
                `SELECT idCategoria FROM categorias WHERE nombre = ? AND tipo = ? AND idCategoria != ?`, 
                [nombre, tipo, this._idCategoria]
            );

            if (categoriaConMismoNombre && categoriaConMismoNombre.length > 0) {
                return { success: false, msg: "Ya existe otra categoría con ese nombre y tipo" };
            }

            const result = await conexion.execute(
                `UPDATE categorias SET nombre=?, tipo=? WHERE idCategoria = ?`, 
                [nombre, tipo, this._idCategoria]
            );
            
            if (result && result.affectedRows && result.affectedRows > 0) {
                const { rows: categoriaActualizada } = await conexion.execute(
                    `SELECT idCategoria, nombre, tipo FROM categorias WHERE idCategoria=?`, 
                    [this._idCategoria]
                );
                
                return { 
                    success: true, 
                    msg: "Categoría actualizada correctamente", 
                    categoria: categoriaActualizada[0] as CategoriaData 
                };
            } else {
                return { success: false, msg: "No fue posible actualizar la categoría" };
            }
        } catch (error) {
            console.error("Error al actualizar categoría:", error);
            return { success: false, msg: `Error interno del servidor: ${error}` };
        }
    }

    public async EliminarCategoria(): Promise<{ success: boolean; msg: string }> {
        try {
            if (!this._idCategoria) {
                return { success: false, msg: "No se ha enviado ningún idCategoria" };
            }

            // Verificar si la categoría existe
            const { rows: categoriaExistente } = await conexion.execute(
                `SELECT idCategoria FROM categorias WHERE idCategoria = ?`, 
                [this._idCategoria]
            );

            if (!categoriaExistente || categoriaExistente.length === 0) {
                return { success: false, msg: "La categoría no existe" };
            }

            // Verificar si hay transacciones asociadas a esta categoría
            const { rows: transaccionesAsociadas } = await conexion.execute(
                `SELECT id FROM transacciones WHERE categoria_id = ? LIMIT 1`, 
                [this._idCategoria]
            );

            if (transaccionesAsociadas && transaccionesAsociadas.length > 0) {
                return { success: false, msg: "No se puede eliminar la categoría porque tiene transacciones asociadas" };
            }

            const result = await conexion.execute(
                `DELETE FROM categorias WHERE idCategoria = ?`, 
                [this._idCategoria]
            );
            
            if (result && result.affectedRows && result.affectedRows > 0) {
                return { success: true, msg: "Categoría eliminada correctamente" };
            } else {
                return { success: false, msg: "No fue posible eliminar la categoría" };
            }
        } catch (error) {
            console.error("Error al eliminar categoría:", error);
            return { success: false, msg: `Error interno del servidor: ${error}` };
        }
    }

    // Método para obtener una categoría por ID
    public async ObtenerCategoriaPorId(idCategoria: number): Promise<CategoriaData | null> {
        try {
            const { rows } = await conexion.execute(
                `SELECT idCategoria, nombre, tipo FROM categorias WHERE idCategoria = ?`, 
                [idCategoria]
            );
            
            if (rows && rows.length > 0) {
                return rows[0] as CategoriaData;
            }
            return null;
        } catch (error) {
            console.error("Error al obtener categoría por ID:", error);
            return null;
        }
    }

    // Método para obtener categorías por tipo
    public async ObtenerCategoriasPorTipo(tipo: TipoCategoria): Promise<CategoriaData[]> {
        try {
            const { rows } = await conexion.execute(
                `SELECT idCategoria, nombre, tipo FROM categorias WHERE tipo = ? ORDER BY nombre`, 
                [tipo]
            );
            return rows as CategoriaData[];
        } catch (error) {
            console.error("Error al obtener categorías por tipo:", error);
            return [];
        }
    }
}