import { Router } from "../Dependencies/Dependencias.ts";
import { authMiddleware } from "../Middlewares/ValidateJWT.ts";
import { getUsuarios,postUsuario,putUsuario,deleteUsuario } from "../Controllers/UserController.ts";

const UserRouter = new Router();

UserRouter.get("/users",authMiddleware, getUsuarios);

UserRouter.get("/protected",authMiddleware,(ctx) =>{
    ctx.response.status = 200;
    ctx.response.body = {
        success: true,
        msg: "Acceso permitido",
        user: ctx.state.user
    };
});
UserRouter.post("/users",postUsuario);
UserRouter.put("/users",putUsuario);
UserRouter.delete("/users",deleteUsuario);


export {UserRouter}