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
        response.status = 400;
        response.body = { success: false, msg: "Error al procesar la solicitud", errors: error };
    }
}

export const postCategoria = async (ctx: any) => {

    const { request, response } = ctx;

    try {
        const contentLength = request.headers.get("Content-Length");

        if (contentLength === "0") {
            response.status = 400;
            response.body = { success: false, msg: "El cuerpo de la solicitud no puede estar vacio" };
            return;
        }

        const body = await request.body.json();
        const CategoriaData = {
            idCategoria: null,
            nombre: body.nombre,
            tipo: body.tipo
        };

        const objCategoria = new Categoria(CategoriaData);
        const result = await objCategoria.InsertarCategoria();
        response.status = 200;
        response.body = { success: true, body: result };

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
        const CategoriaData = {
            idCategoria: body.idCategoria,
            nombre: body.nombre,
            tipo: body.tipo
        };

        const objCategoria = new Categoria(CategoriaData, body.idCategoria);
        const result = await objCategoria.ActualizarCategoria();
        response.status = 200;
        response.body = { success: true, body: result };

    } catch (error) {
        response.status = 400;
        response.body = { success: false, msg: `Error al procesar la solicitud ${error}` };
    }
}

export const deleteCategoria = async (ctx: any) => {

    const { request, response } = ctx;

    try {
        const contentLength = request.headers.get("Content-Length");

        if (contentLength === "0") {
            response.status = 400;
            response.body = { success: false, msg: "El cuerpo de la solicitud no puede estar vacio" };
            return;
        }

        const body = await request.body.json();
        const objCategoria = new Categoria(null, body.idCategoria);
        const result = await objCategoria.EliminarCategoria();
        response.status = 200;
        response.body = { success: true, body: result };
    } catch (error) {
        response.status = 400;
        response.body = { success: false, msg: "Error al procesar la solicitud", errors: error };
    }

}
