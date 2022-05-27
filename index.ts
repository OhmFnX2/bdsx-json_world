import { BlockPos, Vec3 } from "bdsx/bds/blockpos"
import { Player } from "bdsx/bds/player"
import { events } from "bdsx/event"
import { bedrockServer } from "bdsx/launcher"

events.serverOpen.on(() => {
    console.log("[Json World] launching");
});
events.serverClose.on(() => {
    console.log("[Json World] stoping");
});
bedrockServer.afterOpen().then(() => {
    require("./src/main");
});
