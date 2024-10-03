export interface IHTML5Repository {
    uri: string;
    uaa: {
        url: string;
        clientid: string;
        clientsecret: string;
    },
    grant_type: string;
    "sap.cloud.service": string;
}

export interface IUserXSAppJSON {
    authenticationMethod?: "route" | "none";
    routes: IXSAppRoute[];
    welcomeFile?: string;
}

export interface IDefaultXSAppJSON {
    authenticationMethod: "route" | "none";
    routes: IXSAppRoute[];
    welcomeFile?: string;
}

export interface IXSAppRoute {
    source: string;
    target?: string;
    destination?: string;
    service?: string;
    authenticationType?: "xsuaa" | "basic" | "none";
    localDir?: string;
}

export interface IXSUAACredentials {
    apiurl: string;
    clientid: string;
    clientsecret: string;
    credentialtype: string;
    identityzone: string;
    identityzoneid: string;
    sburl: string;
    serviceInstanceId: string;
    subaccountid: string;
    tenantid: string;
    tenantmode: string;
    uaadomain: string;
    url: string;
    verificationkey: string;
    xsappname: string;
    zoneid: string;
}

declare module "express-session" {
    interface SessionData {
        accessToken?: string;
        originPath?: string;
    }
}