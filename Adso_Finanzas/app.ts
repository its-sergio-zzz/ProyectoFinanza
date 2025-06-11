import { Application, oakCors } from "./Dependencies/Dependencias.ts";
import { CategoriaRouter } from "./Routes/CategoriasRouter.ts";
import { TransaccionesRouter } from "./Routes/TransaccionRoutes.ts";
import { LoginRouter } from "./Routes/LoginRouter.ts";
import { UserRouter } from "./Routes/UserRouters.ts";
import { CuentaRouter } from "./Routes/CuentaRouter.ts";
import { TipoCuentaRouter } from "./Routes/TipoCuentaRouter.ts";

import { send } from "https://deno.land/x/oak@v17.1.3/send.ts";


const app = new Application();

app.use(oakCors());


// Registrar todos los routers
const routers = [LoginRouter, UserRouter, TipoCuentaRouter, CuentaRouter, TransaccionesRouter, CategoriaRouter];
app.use(async (ctx, next)=>{
    if(ctx.request.url.pathname.startsWith("/uploads")){
        const filepath = ctx.request.url.pathname.replace("/uploads/","");
        await send(ctx,filepath,{
            root: `${Deno.cwd()}/serverImagen/uploads`,
        });
    }else{
        await next();
    }
});



routers.forEach((router) => {
    app.use(router.routes());
    app.use(router.allowedMethods());
});

console.log("🚀 Servidor de finanzas corriendo en el puerto 8000");


app.listen({ port: 8000 });