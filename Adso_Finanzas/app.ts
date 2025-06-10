import { Application, oakCors } from "./Dependencies/Dependencias.ts";
// import { UserRouter } from "./Routes/UserRoutes.ts";
import { CategoriaRouter } from "./Routes/CategoriasRouter.ts";

import { TransaccionesRouter } from "./Routes/TransaccionRoutes.ts";

const app = new Application();

app.use(oakCors());

// Registrar todos los routers
const routers = [  TransaccionesRouter, CategoriaRouter];


routers.forEach((router) => {
    app.use(router.routes());
    app.use(router.allowedMethods());
});

console.log("🚀 Servidor de finanzas corriendo en el puerto 8000");

app.listen({ port: 8000 });