import { Client } from "../Dependencies/Dependencias.ts";

export const conexion = await new Client().connect({
    hostname: "localhost",
    username: "root",
    db: "adso_finanzas",
    password: "",
})