import express from "express";
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

app.use("/fakeapprouterui", express.static("./fakeapprouterui"));

app.listen(1300, () => {
    console.log("HTML5 Repository is running on port 1300")
});