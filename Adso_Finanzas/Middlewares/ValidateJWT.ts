
import {VerificarToken} from "../Helpers/Jwt.ts";
import { Context, Next } from "https://deno.land/x/oak@v17.1.3/mod.ts";


// Middleware para proteger las rutas
export async function authMiddleware(ctx: Context, next: Next) {
    const authHeader = ctx.request.headers.get("Authorization");

    if (!authHeader) {
        ctx.response.status = 401;
        ctx.response.body = { error: "No autorizado" };
        return;
    }

    const token = authHeader.split(" ")[1];
    const usuario = await VerificarToken(token);

    if (!usuario) {
        ctx.response.status = 401;
        ctx.response.body = { error: "Token invalido o expirado" };
        return;
    }

    ctx.state.user = usuario;
    await next();
}