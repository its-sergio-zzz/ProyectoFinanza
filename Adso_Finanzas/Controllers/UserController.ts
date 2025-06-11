import { ListarUsuarios } from "../Models/UserModel.ts";
import { Usuario } from "../Models/UserModel.ts";


export const getUsuarios = async (ctx: any) =>{
    const { response } = ctx;

    try{
        const result = await ListarUsuarios();

        if(result.success){
            response.status=200;
            response.body={success: true, data: result.data, total: result.data.length};
        }else{
            response.status = 400;
            response.body = { success: false, msg: result.msg || "Error al obtener a los usuarios"};
        }
    }catch(error){
        response.status = 500;
        response.body = {success: false, error: `Error interno del servidor ${error}`,};
    }
};

export const postUsuario = async (ctx: any) =>{
    const {request, response } = ctx;

    try{
        const length = request.headers.get("Content-Length");
        if(length === 0){
            response.status =400;
            response.body= {success:false, msg:"El cuerpo de la solicitud no puede estar vacio"};
            return;
        }
        const formData = await request.body.formData();
        const objUsuario = new Usuario();
        const result = await objUsuario.InsertarUsuario(formData);
        response.status=200;
        response.body={success: true, msg: result.msg, usuario: result.usuario};
    }catch(error){
        response.status = 400;
        response.body = {success: false, msg:`Error interno del servidor:${error}`};
    }
};

export const putUsuario = async (ctx: any) =>{
    const {request, response, params } = ctx;
    try{
        const id= params.id;
        if(!id){
            response.status = 400;
            response.body = {success: false, msg: "iud del usuario no proporcionado"};
            return;
        }

        const formData = await request.body.formData();
        const objUsuario = new Usuario();
        const result = await objUsuario.ActualizarUsuario(id,formData);
        
        response.status =200;
        response.body = { success: true, msg: result.msg, usuario:result.usuario};
    }catch(error){
        response.status = 400;
        response.body = {success:false, msg:`Error interno del servidor:${error}`};
    }
};

export const deleteUsuario = async (ctx: any) =>{
    const {params, response} = ctx;

    try{
        const id = params.id;
        if(!id){
            response.status = 400;
            response.body={success:false, msg: "Id del usuario no proporcionado"};
            return;
        }
        const objUsuario = new Usuario();
        const result = await objUsuario.EliminarUsuario(id);
        if(result){
            response.status = 200;
            response.body = { success: true, msg:"Usuario eliminado correctamente"};
        }else{
            response.status = 400;
            response.body = {success: false, msg: "Usuario no encontrado"}
        }
    }catch(error){
        response.status= 400;
        response.body= {success: false, msg: `Error interno del servidor:${error}`};
    }
}

