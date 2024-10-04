import express, { Response } from "express";
import xsenv from "@sap/xsenv";
import passport from "passport";
import xssec from "@sap/xssec";
import cookieParser from "cookie-parser";

const app = express();

xsenv.loadEnv();

passport.use("JWT", new xssec.v3.JWTStrategy(xsenv.getServices({
    uaa: {
        tag: "xsuaa"
    }
}).uaa, {}));

app.use(cookieParser());

app.use(passport.initialize());

app.use(
    passport.authenticate("JWT", {
        session: false
    })
);

app.use(express.json());

app.get("/backend-server/*", (req, res: Response<{ author: string; }>) => {
    res.json({
        author: "Hasan Ciftci"
    });
    return;
});

app.listen(4004, () => {
    console.log("Backend server is running on port 4004");
});