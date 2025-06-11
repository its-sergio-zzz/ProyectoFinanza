import { conexion } from "./Conexion.ts";
import { z } from "../Dependencies/Dependencias.ts";

interface UsuarioData{
    idUsuario: number | null;
    nombre: string;
    email: string;
    password:string;
    fecha_registro: Date;
}


export class Usuario{
    public _objUsuario: UsuarioData | null;
    public _idUsuario: number | null;

    constructor (objUsuario:UsuarioData | null = null, idUsuario: number | null = null){
        this._objUsuario = objUsuario;
        this._idUsuario = idUsuario;
    }

    public async InsertarUsuario(formData:FormData): Promise<{success: boolean; msg:string; usuario?: Record<string,unknown>}>{
        try{
          const nombre = formData.get("nombre")?.toString()||"";
          const email = formData.get("email")?.toString()||"";
          const password = formData.get("password")?.toString()||"";
          const fecha_registro = formData.get("fecha_registro")?.toString()||"";

          const imagenFile = formData.get("imagenUsuario");
          let imagenFileName ="";
          if(imagenFile instanceof File){
            const uploadDir = `${Deno.cwd()}/serverImagen/uploads`;
            try{
              await Deno.stat(uploadDir);
            }catch{
              await Deno.mkdir(uploadDir, { recursive: true });
            }
            const timestamp = Date.now();
            const random = Math.floor(Math.random()*100);
            imagenFileName = `${timestamp}_${random}_${imagenFile.name}`;
            const filePath = `${uploadDir}/${imagenFileName}`;
            const arrayBuffer = await imagenFile.arrayBuffer();
            const fileContent = new Uint8Array(arrayBuffer);
            await Deno.writeFile(filePath, fileContent);
          }else{
            return {success:false, msg:"No se proporciono ninguna imagen valida"}
          }
          await conexion.execute('START TRANSACTION');
          const result = await conexion.execute("INSERT INTO usuarios (nombre, email, password, fecha_registro, imagenUsuario) VALUES (?, ?, ?, ?, ?)",[nombre, email, password, fecha_registro, imagenFileName]);
          if(result && typeof result.affectedRows === "number" && result.affectedRows > 0){
            const {usuario} = await conexion.query("SELECT * FROM usuarios WHERE idUsuario = LAST_INSERT_ID()");
            await conexion.execute("COMMIT");
            return {success:true, msg:"Usuario insertado coprrectamente", usuario:usuario};
          }else{
            return { success:false, msg:"NO se pudo insertar el usuario"};
          }

        }catch (error){
          if(error instanceof z.ZodError){
            return {success: false, msg: error.message};
          }else{
            return{ success: false, msg:`Error interno del servidor:${error}`};
          }
        }
    }
    public async ActualizarUsuario(idUsuario:number,formData:FormData): Promise<{ success: boolean; msg: string; usuario?: Record<string, unknown> }> {
    try {
     const nombre = formData.get("nombre")?.toString() || "";
      const email = formData.get("email")?.toString() || "";
      const password = formData.get("password")?.toString() || "";
      const fecha_registro = formData.get("fecha_registro")?.toString() || "";
      
      const imagenFile = formData.get("imagenUsuario");
      let imagenFileName = "";
      if (imagenFile instanceof File) {
        const uploadDir = `${Deno.cwd()}/serverImagen/uploads`;
        try {
          await Deno.stat(uploadDir);
        } catch {
          await Deno.mkdir(uploadDir, { recursive: true });
        }
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 100);
        imagenFileName = `${timestamp}_${random}_${imagenFile.name}`;
        const filePath = `${uploadDir}/${imagenFileName}`;
        const arrayBuffer = await imagenFile.arrayBuffer();
        const fileContent = new Uint8Array(arrayBuffer);
        await Deno.writeFile(filePath, fileContent);
      } else {
        const { rows} = await conexion.execute("SELECT imagenUsuario FROM usuarios WHERE idUsuario = ?", [idUsuario]);
        if(rows && rows.length >0){
          imagenFileName = rows[0]?.imagenUsuario || "";
        }else{
          imagenFileName = "";
        }
      }
      await conexion.execute("START TRANSACTION");
      const result = await conexion.execute("UPDATE usuarios SET nombre = ?, email = ?, password = ?, fecha_registro = ?, imagenUsuario = ? WHERE idUsuario = ?", [nombre, email, password, fecha_registro, imagenFileName, idUsuario]);
      if(result && typeof result.affectedRows ==="number" && result.affectedRows >0){
        const {usuario }= await conexion.query("SELECT * FROM usuarios WHERE idUsuario =?",[idUsuario]);
        await conexion.execute("COMMIT");
        return{success:true,msg:"Usuario actualizado cotrrectamnete",usuario:usuario};
      }else{
        return {success:false,msg:"No se pudo actualizar el usuario"};
      }
  }catch(error){
    if(error instanceof z.ZodError){
      return{success:false  , msg:`Error de validacion:${error.message}`};
    }else{
    return{success:false, msg:`Error interno del servidor: ${error}`};
  }
}
  }

  public async EliminarUsuario(idUsuario:number): Promise<{ success: boolean; msg: string; usuario?:Record<string,unknown> }> {
    try{
       
        await conexion.execute(`START TRANSACTION`);
        const result = await conexion.execute(`DELETE FROM usuarios WHERE idUsuario = ?`, [idUsuario]);
        if(result && typeof result.affectedRows === "number" && result.affectedRows > 0){
            await conexion.execute("COMMIT");
            return { success : true, msg:"Usuario eliminado correctamnete"};
        }else{
            throw new Error ("No fue posible eliminar el usuario")
        }
    }catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, msg: error.message };
        } else {
            return { success: false, msg: `Error interno del servidor ${error}` };
        }
    }
}
}


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