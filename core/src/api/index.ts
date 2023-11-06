import { app } from "./app.js";
import routes from "./routes.js";

app.use(routes).listen(Bun.env.PORT || 4000);
