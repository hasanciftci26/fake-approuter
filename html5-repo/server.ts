import express from "express";

const app = express();

app.use("/fakeapprouterui", express.static("./fakeapprouterui"));

app.listen(1300, ()=>{
    console.log("HTML5 Repository is running on port 1300")
});