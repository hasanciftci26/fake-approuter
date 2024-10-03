import xsenv from "@sap/xsenv";
import CustomError from "./CustomError";
import { IXSUAACredentials } from "../types";
import qs from "qs";
import axios from "axios";

export default class AuthorizationServer {
    private redirectUri: string;
    private xsuaa: IXSUAACredentials;

    constructor(redirectUri: string) {
        this.redirectUri = redirectUri;
    }

    public getLoginURL(): string {
        this.loadXSUAAInstance();
        const encodedUri = encodeURIComponent(this.redirectUri);
        const clientId = this.xsuaa.clientid;
        const xsuaaHost = this.xsuaa.url;
        return `${xsuaaHost}/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodedUri}`;
    }

    public async getUserToken(authorizationCode: string) {
        this.loadXSUAAInstance();
        const form = qs.stringify({
            grant_type: "authorization_code",
            code: authorizationCode,
            client_id: this.xsuaa.clientid,
            client_secret: this.xsuaa.clientsecret,
            redirect_uri: this.redirectUri
        });
        const response = await axios.post(this.xsuaa.url + "/oauth/token", form, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        });

        return (response.data as { access_token: string; }).access_token;
    }

    private loadXSUAAInstance() {
        try {
            const instance = xsenv.getServices({
                xsuaa: {
                    label: "xsuaa"
                }
            });

            this.xsuaa = instance.xsuaa as IXSUAACredentials;
        } catch (error) {
            throw new CustomError("XSUAA instance must be bound to the approuter", 404);
        }
    }
}