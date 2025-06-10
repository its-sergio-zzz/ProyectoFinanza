import { ListarUsuarios } from "../Models/UserModel.ts";


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
}