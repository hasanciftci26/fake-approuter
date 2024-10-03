import express, { Response } from "express";

const app = express();

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