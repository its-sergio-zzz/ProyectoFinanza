import { Application, oakCors } from "./Dependencies/Dependencias.ts";

const app =  new Application();

app.use(oakCors());

const routers = [];

routers.forEach((router)=>{
    app.use(router.routes());
    app.use(router.allowedMethods());
});

console.log("Servidor corriendo por el puerto 8000");

app.listen({ port:8000 });