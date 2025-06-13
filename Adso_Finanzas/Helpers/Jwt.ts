import { create, verify, getNumericDate } from "../Dependencies/Dependencias.ts";
import { generarKey } from "./CriptoKey.ts";

const key = Deno.env.get("MY_SECRET_KEY") || "ADSOJWTSERVER";
const server = Deno.env.get("SERVER") || "http://localhost:8000/server_jwt";

export const CrearToken = async (userId: string): Promise<string> => {
    try {
        const payload = {
            iss: server,
            sub: userId,
            usuario_id: userId, // 👈 Agregamos esto
            exp: getNumericDate(60 * 60), // 1 hora
        };

        const secretKey = await generarKey(key);
        return await create({ alg: "HS256", typ: "JWT" }, payload, secretKey);
    } catch (error) {
        console.error("Error al crear el token:", error);
        throw new Error("Error al crear el token JWT");
    }
};


interface TokenPayload {
    iss: string;
    sub: string;
    exp: number;
}

export const VerificarToken = async (token: string): Promise<TokenPayload | null> => {
    try {
        const secretKey = await generarKey(key);
        const payload = await verify(token, secretKey);
        return payload as TokenPayload;
    } catch (error) {
        console.error("Error al verificar el token:", error);
        return null;
    }
};