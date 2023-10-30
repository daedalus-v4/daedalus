import Elysia from "elysia";
import routes from "./routes.js";

new Elysia().use(routes).listen(Bun.env.PORT || 4000);
