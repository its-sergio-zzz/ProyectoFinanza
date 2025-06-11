import { conexion } from "./Conexion.ts";
import { z } from "../Dependencies/Dependencias.ts";

type TipoCategoria = 'ingreso' | 'gasto';

interface CategoriaData {
    id: number | null;
    nombre: string;
    tipo: TipoCategoria;
}

export class Categoria {

    public _objCategoria: CategoriaData | null;
    public _id: number | null;

    constructor(objCategoria: CategoriaData | null = null, id: number | null = null ){
        this._objCategoria = objCategoria;
        this._id = id;
        
    }

    public async SeleccionarCategoria():Promise<CategoriaData[]>{
        const {rows: categorias} = await conexion.execute(`SELECT * FROM categorias`);
        return categorias as CategoriaData[];
    }

    public async InsertarCategoria(): Promise< {success: boolean; msg: string; categorias?: Record<string, unknown>}>{
        try {
            if(!this._objCategoria){
                throw new Error ("No se ha enviado ninguna categoria");
            }

            const {nombre, tipo} = this._objCategoria;
            if(!nombre || !tipo){
                throw new Error ("Faltan campos requeridos para insertar la categoria.");
            }

            await conexion.execute("START TRANSACTION");
            const result = await conexion.execute(`INSERT INTO categorias (nombre, tipo) VALUES (?,?)`, [nombre,tipo]);
            if(result && typeof result.affectedRows === "number" && result.affectedRows > 0){
                const [categorias] = await conexion.query(`SELECT * FROM categorias WHERE id = LAST_INSERT_ID()`,);
                await conexion.execute("COMMIT");
                return { success: true, msg: "Categoria creada correctamente.", categorias:categorias };
            }else{
                throw new Error ("Error, no fue posible registrar la categoria");
            }
        } catch (error) {
            if(error instanceof z.ZodError){
                return { success: false, msg: error.message };
            }else{
                return { success: false, msg: `Error interno del servidor ${error}` };
            }
        }
    }


    public async ActualizarCategoria() : Promise<{ success: boolean, msg: string, categorias?: Record<string, unknown>}>{
        try {
            if(!this._objCategoria){
                throw new Error("No se ha enviado ninguna categoria");
            }
            const { nombre, tipo} = this._objCategoria;
            if(!nombre || !tipo ){
                throw new Error ("Faltan campos requeridos para actualizar la Categoria");
            }

            await conexion.execute("START TRANSACTION");
            const result = await conexion.execute(`UPDATE categorias SET nombre=?,tipo=? WHERE id = ?`, [nombre, tipo, this._id,]);
            if(result && typeof result.affectedRows === "number" && result.affectedRows > 0){
                const [categorias] = await conexion.query (`SELECT * FROM categorias WHERE id=?`, [this._id]);
                await conexion.execute("COMMIT");
                return { success: true, msg:"Categoria actualizada correctamente", categorias:categorias };
            }else{
                throw new Error ("No fue posible actualizar la categoria");
            }
        } catch (error) {
            if(error instanceof z.ZodError){
                return { success: false, msg: error.message }
            }else{
                return { success: false, msg: `Error interno del servidor ${error}` };
            }
        }
    }

    public async EliminarCategoria(): Promise <{success: boolean; msg: string; categorias?: Record<string, unknown>}>{
        try {
            if(!this._id){
                throw new Error ("No se ha enviado ningun id");
            }
            await conexion.execute("START TRANSACTION");
            const result = await conexion.execute(`DELETE FROM categorias WHERE id = ?`, [this._id]);
            if(result && typeof result.affectedRows === "number" && result.affectedRows > 0){
                await conexion.execute("COMMIT");
                return { success: true, msg: "Categoria eliminada correctamente" };
            }else{
                throw new Error ("No fue posible eliminar la categoria");
            }
        } catch (error) {
            if(error instanceof z.ZodError){
                return { success: false, msg: error.message };
            }else{
                return { success: false, msg: `Error interno del servidor ${error}` };
            }
        }
    }

}