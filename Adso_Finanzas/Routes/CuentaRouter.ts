import { Router } from "../Dependencies/Dependencias.ts";
import { authMiddleware } from "../Middlewares/ValidateJWT.ts";
import {
    getCuentas,
    getCuentaPorId,
    postCuenta,
    putCuenta,
    deleteCuenta,
    getResumenFinanciero
} from "../Controllers/CuentaController.ts";

const CuentaRouter = new Router();

CuentaRouter.use(authMiddleware);

CuentaRouter.get("/cuenta", getCuentas);                    
CuentaRouter.get("/cuenta/:id", getCuentaPorId);           
CuentaRouter.post("/cuenta", postCuenta);                  
CuentaRouter.put("/cuenta/:id", putCuenta);              
CuentaRouter.delete("/cuenta/:id", deleteCuenta);         


CuentaRouter.get("/resumen-financiero", getResumenFinanciero);

export { CuentaRouter };