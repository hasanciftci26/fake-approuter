import express, { Request } from "express";
import xsenv from "@sap/xsenv";
import HTML5Repository from "./lib/HTML5Repository";
import session from "express-session";
import FakeRouter from "./lib/FakeRouter";
import AuthorizationServer from "./lib/AuthorizationServer";
import path from "path";

const app = express();
const router = new FakeRouter();

// Load the environment variables from the default-env.json file
xsenv.loadEnv();

// REST API Conversion
app.use(express.json());

// Activate session usage
app.use(
    session({
        secret: "default-secret-key",
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false } // Set to true if using HTTPS
    })
);

// Root path
app.get("/", async (req, res, next) => {
    req.session.originPath = "/";
    router.setUserToken(req.session.accessToken);

    if (router.isLoginRequired()) {
        const auth = new AuthorizationServer(`${req.protocol}://${req.get("host")}/login/callback`);

        try {
            return res.redirect(auth.getLoginURL());
        } catch (error) {
            return next(error);
        }
    } else {
        try {
            const welcomePath = await router.serveWelcomeFile();
            res.redirect(welcomePath);
            return;
        } catch (error) {
            return next(error);
        }
    }
});

app.get("/login/callback", async (req: Request<{}, {}, {}, { code: string; }>, res) => {
    const auth = new AuthorizationServer(`${req.protocol}://${req.get("host")}/login/callback`);
    const userToken = await auth.getUserToken(req.query.code);
    req.session.accessToken = userToken;
    res.redirect(req.session.originPath as string);
    return;
});

router.getLocalDirectories().forEach((directory) => {
    app.get(`/${directory}/*`, async (req, res, next) => {
        req.session.originPath = req.url;
        router.setUserToken(req.session.accessToken);

        if (router.isLoginRequired()) {
            const auth = new AuthorizationServer(`${req.protocol}://${req.get("host")}/login/callback`);

            try {
                return res.redirect(auth.getLoginURL());
            } catch (error) {
                return next(error);
            }
        } else {
            try {
                res.sendFile(path.join(__dirname, req.url));
                return;
            } catch (error) {
                return next(error);
            }
        }
    });
});

router.getRoutes().forEach((route) => {
    app.get(new RegExp(route.source), async (req, res, next) => {
        req.session.originPath = req.url;
        router.setUserToken(req.session.accessToken);

        if (router.isLoginRequired()) {
            const auth = new AuthorizationServer(`${req.protocol}://${req.get("host")}/login/callback`);

            try {
                return res.redirect(auth.getLoginURL());
            } catch (error) {
                return next(error);
            }
        } else {
            try {
                const content = await router.getContent(req.url);
                res.send(content);
                return;
            } catch (error) {
                return next(error);
            }
        }
    });
});

if (router.isWelcomeFileAvailable()) {
    app.get(router.getWelcomeFilePath() + "/*", async (req, res, next) => {
        req.session.originPath = req.url;
        router.setUserToken(req.session.accessToken);

        if (router.isLoginRequired()) {
            const auth = new AuthorizationServer(`${req.protocol}://${req.get("host")}/login/callback`);

            try {
                return res.redirect(auth.getLoginURL());
            } catch (error) {
                return next(error);
            }
        } else {
            const html5 = new HTML5Repository(router.getWelcomeFilePath());

            try {
                const content = await html5.getContent(req.url, req.session.accessToken as string);
                res.send(content);
                return;
            } catch (error) {
                return next(error);
            }
        }
    });
}

app.listen(1299, () => {
    console.log("Approuter is running on port 1299");
});