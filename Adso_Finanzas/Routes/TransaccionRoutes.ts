import { Router } from "../Dependencies/Dependencias.ts";
import { authMiddleware } from "../Middlewares/ValidateJWT.ts";
import {
    getTransacciones,
    postTransaccion,
    putTransaccion,
    deleteTransaccion,
    getCuentas,
    getCategorias,
    getTransaccionesFiltradas
} from "../Controllers/TransaccionController.ts";

const TransaccionesRouter = new Router();

// Todas las rutas están protegidas con autenticación JWT
TransaccionesRouter.use(authMiddleware);

// Rutas para transacciones
TransaccionesRouter.get("/transacciones", getTransacciones);
TransaccionesRouter.post("/transacciones", postTransaccion);
TransaccionesRouter.put("/transacciones/:id", putTransaccion);
TransaccionesRouter.delete("/transacciones/:id", deleteTransaccion);

// Rutas para obtener transacciones con filtros
TransaccionesRouter.get("/transacciones/filtrar", getTransaccionesFiltradas);

// Rutas auxiliares para obtener datos necesarios
TransaccionesRouter.get("/cuentas", getCuentas);
TransaccionesRouter.get("/categorias", getCategorias);

export { TransaccionesRouter };