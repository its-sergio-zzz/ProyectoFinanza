import { Router } from "../Dependencies/Dependencias.ts";
import { postUserLogin } from "../Controllers/LoginController.ts";

const LoginRouter = new Router();

LoginRouter.post("/",postUserLogin);

export{LoginRouter};