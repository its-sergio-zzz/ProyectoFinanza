import { Router } from "../Dependencies/Dependencias.ts";
import { getCategoria, postCategoria, putCategoria, deleteCategoria } from "../Controllers/CategoriasController.ts";

const CategoriaRouter = new Router();

CategoriaRouter.get("/categorias", getCategoria);
CategoriaRouter.post("/categorias", postCategoria);
CategoriaRouter.put("/categorias", putCategoria);
CategoriaRouter.delete("/categorias", deleteCategoria);

export {CategoriaRouter};