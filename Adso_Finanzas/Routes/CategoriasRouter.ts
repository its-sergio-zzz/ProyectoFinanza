import { Router } from "../Dependencies/Dependencias.ts";
import { 
    getCategoria, 
    postCategoria, 
    putCategoria, 
    deleteCategoria,
    getCategoriaById,
    getCategoriasByTipo
} from "../Controllers/CategoriasController.ts";

const CategoriaRouter = new Router();

// Rutas públicas - no requieren autenticación
CategoriaRouter.get("/categorias", getCategoria);                      // GET /categorias - Obtener todas las categorías
CategoriaRouter.get("/categorias/filtrar", getCategoriasByTipo);       // GET /categorias/filtrar?tipo=ingreso|gasto
CategoriaRouter.get("/categorias/:id", getCategoriaById);              // GET /categorias/:id - Obtener categoría por ID

// Rutas que requieren autenticación (agregar middleware cuando sea necesario)
CategoriaRouter.post("/categorias", postCategoria);                   // POST /categorias - Crear nueva categoría
CategoriaRouter.put("/categorias", putCategoria);                     // PUT /categorias - Actualizar categoría
CategoriaRouter.delete("/categorias", deleteCategoria);               // DELETE /categorias - Eliminar categoría

export { CategoriaRouter };