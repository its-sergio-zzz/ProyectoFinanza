import { conexion } from "./Conexion.ts";
import { z } from "../Dependencies/Dependencias.ts";

export const iniciarSesion = async (email:string, passsword:string) =>{
    try{
        const [usuario] = await conexion.query(`SELECT * FROM usuarios WHERE email=?`,[email]);

        if(passsword === usuario.password){
            return{
                success: true,
                msg: "Sesion iniciada correctamente",
                data: usuario,
            }
        }else{
            return{
                success:false
            }
        }
    }catch(error){
        if(error instanceof z.ZodError){
            return{success:false, msg: error.message};
        }else{
            return{success: false, msg: `Error interno del servidor${error}}`};
        }
    }
}