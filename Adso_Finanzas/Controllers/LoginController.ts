import { CrearToken, VerificarToken } from "../Helpers/Jwt.ts";
import { iniciarSesion } from "../Models/LoginModel.ts";

export const postUserLogin = async(ctx: any) => {
    const { request, response} = ctx;

    try {
        const contentLength = request.headers.get("Content-Length");

        if(contentLength === "0"){
            response.status = 400;
            response.body = {success: false, msg:"El cuerpo de la solicitud no puede estar vacio"};
            return;
        }

        const body = await request.body.json();
        if(!body.email || !body.password){
            response.status = 400;
            response.body ={success:false, msg:"Faltan datos (Email o Contraseña"};
            return;
        }

        const result = await iniciarSesion(body.email, body.password);
        if(result.success){
            const token = await CrearToken(result.data.idUsuario);

            response.status= 200;
            response.body ={
                success:true,
                accessToken: token,
                data: `${result.data.nombre}`,
            };
        }else{
            response.status= 401;
            response.body = {
                success:false,
                msg:"Credenciales incorrectas",
            }
        }

    } catch (error) {
        response.status= 500;
        response.body={success:false, msg:`Error interno del servidor ${error}`};
        
    }
}