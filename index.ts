import { events } from "bdsx/event"
import { bedrockServer } from "bdsx/launcher"
import * as fs from "fs"
import * as path from "path"

events.serverOpen.on(() => {
    console.log("[Json World] launching");
    if (!fs.existsSync(path.join(__dirname, "./world"))) return fs.mkdirSync(path.join(__dirname, "./world"))
});
events.serverClose.on(() => {
    console.log("[Json World] stoping");
});
bedrockServer.afterOpen().then(() => {
    require("./src/main");
});
