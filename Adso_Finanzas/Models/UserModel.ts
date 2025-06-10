import { conexion } from "./Conexion.ts";
import { z } from "../Dependencies/Dependencias.ts";

export const ListarUsuarios = async () =>{
    try{
        const usuarios = await conexion.query("SELECT idUsuario, nombre, email, fecha_registro FROM usuarios");
        return {success: true, msg:"Peticion realizada con exito", data: usuarios,};
    }catch(error){
        if(error instanceof z.ZodError){
            return{success: false, msg: error.message};
        }else{
            return{success: false, msg: `Error interno del servidor${error}`};
        }
    }
}