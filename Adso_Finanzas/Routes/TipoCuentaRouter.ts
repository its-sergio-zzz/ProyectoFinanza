import { Router } from "../Dependencies/Dependencias.ts";
import { authMiddleware } from "../Middlewares/ValidateJWT.ts";
import {
    getTiposCuenta,
    getTipoCuentaPorId,
    postTipoCuenta,
    putTipoCuenta,
    deleteTipoCuenta
} from "../Controllers/TipoCuentaController.ts";

const TipoCuentaRouter = new Router();


TipoCuentaRouter.get("/tipos-cuenta", getTiposCuenta);           // GET /tipos-cuenta - Obtener todos los tipos
TipoCuentaRouter.get("/tipos-cuenta/:id", getTipoCuentaPorId);   // GET /tipos-cuenta/:id - Obtener tipo específico


TipoCuentaRouter.post("/tipos-cuenta", authMiddleware, postTipoCuenta);      // POST /tipos-cuenta - Crear tipo
TipoCuentaRouter.put("/tipos-cuenta/:id", authMiddleware, putTipoCuenta);    // PUT /tipos-cuenta/:id - Actualizar tipo
TipoCuentaRouter.delete("/tipos-cuenta/:id", authMiddleware, deleteTipoCuenta); // DELETE /tipos-cuenta/:id - Eliminar tipo

export { TipoCuentaRouter };