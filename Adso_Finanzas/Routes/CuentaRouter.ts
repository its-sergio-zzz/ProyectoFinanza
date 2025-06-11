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

// Middleware de autenticación para todas las rutas
CuentaRouter.use(authMiddleware);

// CRUD completo para cuentas con prefijo /cuenta/ (singular)
CuentaRouter.get("/cuenta", getCuentas);                    // GET /cuenta - Obtener todas las cuentas
CuentaRouter.get("/cuenta/:id", getCuentaPorId);           // GET /cuenta/:id - Obtener cuenta específica
CuentaRouter.post("/cuenta", postCuenta);                  // POST /cuenta - Crear nueva cuenta
CuentaRouter.put("/cuenta/:id", putCuenta);               // PUT /cuenta/:id - Actualizar cuenta
CuentaRouter.delete("/cuenta/:id", deleteCuenta);         // DELETE /cuenta/:id - Eliminar cuenta

// Ruta adicional para resumen financiero
CuentaRouter.get("/resumen-financiero", getResumenFinanciero); // GET /resumen-financiero

export { CuentaRouter };