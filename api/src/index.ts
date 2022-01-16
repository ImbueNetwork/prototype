import { AddressInfo } from "net";
import http from "http";
import createError from "http-errors";
import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import logger from "morgan";
import passport from "passport";

import config from "./config";
import { errorHandler } from "./middleware/errors";
import authenticationMiddleware from "./middleware/authentication";
import routes from "./routes";

const port = process.env.PORT || config.port;
const app = express();
const environment = config.environment;

app.use(logger("dev"));
app.use(express.json());
app.use(cookieParser());
app.use(session(config.session));

app.use(passport.authenticate("session"));
app.use(authenticationMiddleware);
app.use("/api/v1", routes);

// not found
app.use((_req, _res, next) => {
    next(createError(404));
});

// uncaught error
app.use(errorHandler(environment));


const server = http.createServer(app);

server.on("listening", () => {
    const addr = server.address() as AddressInfo;
    console.log(`Service started on port ${addr.port}`);
});

server.listen(port);
