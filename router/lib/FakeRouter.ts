import userXSApp from "../xs-app.json";
import { IDefaultXSAppJSON, IUserXSAppJSON, IXSAppRoute } from "../types";
import HTML5Repository from "./HTML5Repository";
import CustomError from "./CustomError";
import Destination from "./Destination";
import axios, { AxiosRequestConfig } from "axios";

export default class FakeRouter {
    private xsapp: IDefaultXSAppJSON;
    private protectedRoutes: boolean;
    private userToken?: string;

    constructor() {
        this.xsapp = {
            authenticationMethod: (userXSApp as IUserXSAppJSON).authenticationMethod || "route",
            routes: (userXSApp as IUserXSAppJSON).routes,
            welcomeFile: (userXSApp as IUserXSAppJSON).welcomeFile
        };
        this.protectedRoutes = this.xsapp.authenticationMethod === "route";
    }

    public setUserToken(userToken?: string) {
        this.userToken = userToken;
    }

    public isLoginRequired() {
        return this.protectedRoutes === true && this.userToken === undefined;
    }

    public isWelcomeFileAvailable() {
        return this.xsapp.welcomeFile !== undefined;
    }

    public getWelcomeFilePath() {
        return this.xsapp.welcomeFile as string;
    }

    public getLocalDirectories(): string[] {
        return this.xsapp.routes.filter(route => route.localDir).map(route => route.localDir) as string[];
    }

    public getRoutes() {
        const noneLocalRoutes = this.xsapp.routes.filter(route => !route.localDir);

        if (this.xsapp.welcomeFile) {
            return noneLocalRoutes.filter(route => new RegExp(route.source).test(this.xsapp.welcomeFile as string) === false);
        } else {
            return noneLocalRoutes;
        }
    }

    public async getContent(path: string) {
        const routes = this.getRoutes();
        const route = routes.find(rt => new RegExp(rt.source).test(path)) as IXSAppRoute;

        if (!route.destination) {
            throw new CustomError("The destination is missing for the matching route", 404);
        }

        const dest = new Destination(route.destination);
        const destination = await dest.getDestination();
        const config: AxiosRequestConfig = {};

        if (destination.forwardAuthToken) {
            config.headers = {
                Authorization: "Bearer " + this.userToken
            };
        }

        const response = await axios.get(destination.url + path, config);
        return response.data;
    }

    public async serveWelcomeFile() {
        if (!this.xsapp.welcomeFile) {
            throw new CustomError("welcomeFile property is missing", 404);
        }

        const localFilePath = this.getLocalFilePath(this.xsapp.welcomeFile);

        if (localFilePath) {
            return localFilePath;
        } else {
            const html5 = new HTML5Repository(this.xsapp.welcomeFile as string);

            if (!html5.isRepositoryAvailable()) {
                throw new CustomError("HTML5 Repo Runtime service must be bound to the approuter!", 404);
            }

            const repoFilePath = await html5.getWelcomeFilePath();

            return this.xsapp.welcomeFile + repoFilePath;
        }
    }

    private getLocalFilePath(path: string) {
        const route = this.findRoute(path);

        if (!route) {
            return;
        }

        if (!route.localDir) {
            return;
        }

        return "/" + route.localDir + path;
    }

    private findRoute(path: string) {
        return this.xsapp.routes.find(route => new RegExp(route.source).test(path));
    }
}