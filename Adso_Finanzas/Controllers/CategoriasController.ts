// deno-lint-ignore-file
import { Categoria } from "../Models/Categorias.ts";

export const getCategoria = async (ctx: any) => {
    const { response } = ctx;
    try {
        const objCategoria = new Categoria();
        const listaCategoria = await objCategoria.SeleccionarCategoria();
        response.status = 200;
        response.body = { success: true, data: listaCategoria };
    } catch (error) {
        console.error("Error en getCategoria:", error);
        response.status = 500;
        response.body = { success: false, msg: "Error interno del servidor", error: error.message };
    }
}

export const postCategoria = async (ctx: any) => {
    const { request, response } = ctx;

    try {
        const contentLength = request.headers.get("Content-Length");

        if (contentLength === "0") {
            response.status = 400;
            response.body = { success: false, msg: "El cuerpo de la solicitud no puede estar vacío" };
            return;
        }

        const body = await request.body.json();
        
        // Validar campos requeridos
        if (!body.nombre || !body.tipo) {
            response.status = 400;
            response.body = { success: false, msg: "Los campos 'nombre' y 'tipo' son requeridos" };
            return;
        }

        // Validar tipo
        if (body.tipo !== 'ingreso' && body.tipo !== 'gasto') {
            response.status = 400;
            response.body = { success: false, msg: "El tipo debe ser 'ingreso' o 'gasto'" };
            return;
        }

        const CategoriaData = {
            idCategoria: null,
            nombre: body.nombre.trim(),
            tipo: body.tipo
        };

        const objCategoria = new Categoria(CategoriaData);
        const result = await objCategoria.InsertarCategoria();
        
        if (result.success) {
            response.status = 201;
            response.body = { success: true, data: result.categoria, msg: result.msg };
        } else {
            response.status = 400;
            response.body = { success: false, msg: result.msg };
        }

    } catch (error) {
        response.status = 400;
        response.body = { success: false, msg: "Error al procesar la solicitud", errors: error };
    }
}

export const putCategoria = async (ctx: any) => {
    const { request, response } = ctx;

    try {
        const contentLength = request.headers.get("Content-Length");

        if (contentLength === "0") {
            response.status = 400;
            response.body = { success: false, msg: "El cuerpo de la solicitud no puede estar vacío" };
            return;
        }

        const body = await request.body.json();
        
        // Validar ID
        if (!body.idCategoria) {
            response.status = 400;
            response.body = { success: false, msg: "El campo 'idCategoria' es requerido" };
            return;
        }

        // Validar campos requeridos
        if (!body.nombre || !body.tipo) {
            response.status = 400;
            response.body = { success: false, msg: "Los campos 'nombre' y 'tipo' son requeridos" };
            return;
        }

        // Validar tipo
        if (body.tipo !== 'ingreso' && body.tipo !== 'gasto') {
            response.status = 400;
            response.body = { success: false, msg: "El tipo debe ser 'ingreso' o 'gasto'" };
            return;
        }

        const CategoriaData = {
            idCategoria: body.idCategoria,
            nombre: body.nombre.trim(),
            tipo: body.tipo
        };

        const objCategoria = new Categoria(CategoriaData, body.idCategoria);
        const result = await objCategoria.ActualizarCategoria();
        
        if (result.success) {
            response.status = 200;
            response.body = { success: true, data: result.categoria, msg: result.msg };
        } else {
            response.status = 400;
            response.body = { success: false, msg: result.msg };
        }

    } catch (error) {
        response.status = 400;
        response.body = { success: false, msg: `Error al procesar la solicitud: ${error}` };
    }
}

export const deleteCategoria = async (ctx: any) => {
    const { request, response } = ctx;

    try {
        const contentLength = request.headers.get("Content-Length");

        if (contentLength === "0") {
            response.status = 400;
            response.body = { success: false, msg: "El cuerpo de la solicitud no puede estar vacío" };
            return;
        }

        const body = await request.body.json();
        
        // Validar ID
        if (!body.idCategoria) {
            response.status = 400;
            response.body = { success: false, msg: "El campo 'idCategoria' es requerido" };
            return;
        }

        // Validar que el ID sea un número válido
        const idCategoria = parseInt(body.idCategoria);
        if (isNaN(idCategoria) || idCategoria <= 0) {
            response.status = 400;
            response.body = { success: false, msg: "El 'idCategoria' debe ser un número válido mayor a 0" };
            return;
        }

        const objCategoria = new Categoria(null, idCategoria);
        const result = await objCategoria.EliminarCategoria();
        
        if (result.success) {
            response.status = 200;
            response.body = { success: true, msg: result.msg };
        } else {
            response.status = 400;
            response.body = { success: false, msg: result.msg };
        }
    } catch (error) {
        console.error("Error en deleteCategoria:", error);
        response.status = 500;
        response.body = { success: false, msg: "Error interno del servidor", error: error.message };
    }
}

// Obtener una categoría por ID
export const getCategoriaById = async (ctx: any) => {
    const { response, params } = ctx;

    try {
        const idCategoria = parseInt(params.id);
        
        if (!idCategoria || isNaN(idCategoria)) {
            response.status = 400;
            response.body = { success: false, msg: "ID de categoría inválido" };
            return;
        }

        const objCategoria = new Categoria();
        const categoria = await objCategoria.ObtenerCategoriaPorId(idCategoria);
        
        if (categoria) {
            response.status = 200;
            response.body = { success: true, data: categoria };
        } else {
            response.status = 404;
            response.body = { success: false, msg: "Categoría no encontrada" };
        }
    } catch (error) {
        response.status = 400;
        response.body = { success: false, msg: "Error al procesar la solicitud", errors: error };
    }
}

// Obtener categorías por tipo
export const getCategoriasByTipo = async (ctx: any) => {
    const { response, request } = ctx;

    try {
        const url = new URL(request.url);
        const tipo = url.searchParams.get('tipo') as 'ingreso' | 'gasto' | null;
        
        if (tipo && tipo !== 'ingreso' && tipo !== 'gasto') {
            response.status = 400;
            response.body = { success: false, msg: "El parámetro 'tipo' debe ser 'ingreso' o 'gasto'" };
            return;
        }

        const objCategoria = new Categoria();
        
        let listaCategorias;
        if (tipo) {
            listaCategorias = await objCategoria.ObtenerCategoriasPorTipo(tipo);
        } else {
            listaCategorias = await objCategoria.SeleccionarCategoria();
        }
        
        response.status = 200;
        response.body = { success: true, data: listaCategorias };
    } catch (error) {
        response.status = 400;
        response.body = { success: false, msg: "Error al procesar la solicitud", errors: error };
    }
}