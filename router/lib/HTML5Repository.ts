import xsenv from "@sap/xsenv";
import { IDefaultXSAppJSON, IHTML5Repository, IUserXSAppJSON } from "../types";
import axios, { AxiosRequestConfig } from "axios";
import qs from "qs";
import Destination from "./Destination";
import CustomError from "./CustomError";

export default class HTML5Repository {
    private appId: string;
    private xsapp: IDefaultXSAppJSON;
    private repository?: IHTML5Repository;
    private available: boolean;
    private jwtToken?: string;

    constructor(appId: string) {
        this.appId = appId;
        try {
            const repo = xsenv.getServices({
                html5repo: {
                    tag: "html5-apps-repo-rt"
                }
            });

            this.repository = repo.html5repo as IHTML5Repository;
            this.available = true;
        } catch (error) {
            this.available = false;
        }
    }

    public async getContent(requestPath: string, userToken: string) {
        const path = requestPath.replace(this.appId, "");
        await this.loadXSAppJSON();
        const route = this.getRoute(path);

        if (!route) {
            throw new CustomError("The requested route could not be identified.", 404);
        }

        if (route.service === "html5-apps-repo-rt") {
            const token = await this.getJWTToken();

            try {
                const response = await axios.get(this.repository!.uri + requestPath);
                return response.data;
            } catch (error) {
                throw new CustomError("The requested file could not be identified.", 404);
            }
        } else {
            const dest = new Destination(route.destination as string);
            const destination = await dest.getDestination();
            const config: AxiosRequestConfig = {};

            if (destination.forwardAuthToken) {
                config.headers = {
                    Authorization: "Bearer " + userToken
                };
            }

            const response = await axios.get(destination.url + path, config);
            return response.data;
        }
    }

    public isRepositoryAvailable() {
        return this.available;
    }

    public async getWelcomeFilePath() {
        await this.loadXSAppJSON();

        if (!this.xsapp.welcomeFile) {
            throw new CustomError("The xs-app.json file of the HTML5 Repository does not contain welcomeFile", 404);
        }

        return this.xsapp.welcomeFile;
    }

    private async loadXSAppJSON() {
        const token = await this.getJWTToken();
        try {
            const response = await axios.get(this.repository!.uri + this.appId + "/xs-app.json");
            const userXSApp = response.data as IUserXSAppJSON;
            this.xsapp = {
                authenticationMethod: userXSApp.authenticationMethod || "route",
                routes: userXSApp.routes,
                welcomeFile: userXSApp.welcomeFile
            };
        } catch (error) {
            throw new CustomError("The xs-app.json was not identified in the HTML5 Repository", 404);
        }
    }

    private async getJWTToken() {
        if (this.jwtToken) {
            return this.jwtToken;
        }

        const form = qs.stringify({
            grant_type: "client_credentials"
        });

        const response = await axios.post(this.repository!.uaa.url + "/oauth/token", form, {
            auth: {
                username: this.repository!.uaa.clientid,
                password: this.repository!.uaa.clientsecret
            }
        });

        this.jwtToken = (response.data as { access_token: string; }).access_token;
        return this.jwtToken;
    }

    private getRoute(path: string) {
        return this.xsapp.routes.find(route => new RegExp(route.source).test(path));
    }
}