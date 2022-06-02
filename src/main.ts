import { Block } from "bdsx/bds/block"
import { BlockPos, Vec3 } from "bdsx/bds/blockpos"
import { CommandPermissionLevel, CommandPosition } from "bdsx/bds/command"
import { TextPacket } from "bdsx/bds/packets"
import { Player } from "bdsx/bds/player"
import { command } from "bdsx/command"
import { bool_t, CxxString } from "bdsx/nativetype"
import * as fs from "fs"
import * as path from "path"

let cmd = command.register("jsonworld", "Convert World To JsonWorld", CommandPermissionLevel.Operator)

cmd.overload((p, o) => {
    const player = o.getEntity() as Player
    if (!(player instanceof Player)) return false
    let ph = path.join(__dirname, `../world/${p.filename}.json`)
    fs.writeFileSync(ph, "")
    fs.appendFileSync(ph, `{"json_world":[`)
    let x1 = Math.floor(Math.min(p.pos1.x, p.pos2.x))
    let x2 = Math.floor(Math.max(p.pos1.x, p.pos2.x))
    let y1 = Math.floor(Math.min(p.pos1.y, p.pos2.y))
    let y2 = Math.floor(Math.max(p.pos1.y, p.pos2.y))
    let z1 = Math.floor(Math.min(p.pos1.z, p.pos2.z))
    let z2 = Math.floor(Math.max(p.pos1.z, p.pos2.z))
    p.save_air = false
    console.log(p.save_air)
    for(let x = x1; x <= x2; x++) {
        for(let y = y1; y <= y2; y++) {
            for(let z = z1; z <= z2; z++) {
                let block = player.getDimension().blockSource.getBlock(BlockPos.create(x, y, z))
                let blockId = block.blockLegacy.getCommandName()
                if (blockId === "minecraft:air" && p.save_air === false) continue
                console.log("Saveing block: " + blockId + " at " + x + " " + y + " " + z)
                fs.appendFileSync(ph, `{"block_id":"${blockId}","block_data":${block.data},"position":{"x":${x},"y":${y},"z":${z}}},`)
                sendMessage(player, `Saving block ${blockId} at ${x} ${y} ${z}`)
            }
        }
    }
    console.log(`Saving world to ${ph}`)
    sendMessage(player, `Saving world to ${ph}`)
    fs.appendFileSync(ph, `{"block_id":"OhmFn X2","block_data":69,"position":{"x":0,"y":500,"z":0}}]}`)
    return true
}, {
    mode: command.enum("jsonworld.save", "save"),
    pos1: [CommandPosition, false],
    pos2: [CommandPosition, false],
    filename: [CxxString, false],
    save_air: [bool_t, true]
})

cmd.overload((p, o) => {
    const player = o.getEntity() as Player
    if (!(player instanceof Player)) return false
    sendMessage(player, "Loading...")
    if (p.filename == null) return sendMessage(player, "Please specify a file name")
    let ph = path.join(__dirname, `../world/${p.filename}.json`)
    if (!fs.existsSync(ph)) return sendMessage(player, "File not found")
    let data = fs.readFileSync(ph)
    let json = JSON.parse(data.toString())
    let blocks = json.json_world
    p.load_air = false
    for (let block of blocks) {
        let objBlock = block
        let blockId = objBlock.block_id
        let blockData = objBlock.block_data
        let pos = objBlock.position
        let x = pos.x
        let y = pos.y
        let z = pos.z
        if (y>=500) continue
        if (blockId === "minecraft:air" && p.load_air === false) continue
        try {
            player.getDimension().blockSource.setBlock(BlockPos.create(x, y, z), Block.create(blockId, blockData) as Block)
        } catch (e) {
            console.log(e)
            sendMessage(player, "Error loading block")
            return
        }
        console.log("Loading block: " + blockId + " at " + x + " " + y + " " + z)
    }
    console.log("Loading done")
    sendMessage(player, "Loading done")
    return true
}, {
    mode: command.enum("jsonworld.load", "load"),
    filename: [CxxString, false],
    load_air: [bool_t, true]
})

cmd.overload((p, o) => {
    const player = o.getEntity() as Player
    if (!(player instanceof Player)) return false
    let files = fs.readdirSync(path.join(__dirname, "../world"))
    let message = "World files: "
    for (let file of files) {
        message += `"${file.replace(".json", "")}", `
    }
    sendMessage(player, message)
    return true //code by github copilot
}, {
    mode: command.enum("jsonworld.list", "list")
})

function sendMessage(player: Player, message: string, type: TextPacket.Types = 1): void {
    const pk = TextPacket.create()
    pk.type = type
    pk.message = message
    player.sendPacket(pk)
    pk.dispose()
}
