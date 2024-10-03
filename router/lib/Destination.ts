import xsenv from "@sap/xsenv";
import axios from "axios";
import CustomError from "./CustomError";

export default class Destination {
    private name: string;
    private uri: string;
    private available: boolean;

    constructor(name: string) {
        this.name = name;

        try {
            const service = xsenv.getServices({
                destination: {
                    label: "destination"
                }
            });

            this.uri = (service.destination as { uri: string; }).uri;
            this.available = true;
        } catch (error) {
            this.available = false;
        }
    }

    public async getDestination() {
        if (!this.isDestinationServiceAvailable()) {
            throw new CustomError("Destination service must be bound!", 404);
        }

        try {
            const response = await axios.get(this.uri + "/" + this.name);
            return response.data as { name: string; url: string; forwardAuthToken: boolean; };
        } catch (error) {
            throw new CustomError("The following destination could not be found: " + this.name, 404);
        }
    }

    private isDestinationServiceAvailable() {
        return this.available;
    }
} 