import destinations from "./destinations.json";
import express, { Request, Response } from "express";

const app = express();

app.use(express.json());

app.get("/:destinationName", (req: Request<{ destinationName: string; }>, res) => {
    const destination = destinations.find(dest => dest.name === req.params.destinationName);

    if (destination) {
        res.json(destination);
        return;
    } else {
        res.sendStatus(404);
        return;
    }
});

app.listen(1301, () => {
    console.log("Destination service is running on port 1301");
});