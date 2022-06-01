import { Block } from "bdsx/bds/block"
import { BlockPos, Vec3 } from "bdsx/bds/blockpos"
import { CommandPermissionLevel, CommandStringEnum } from "bdsx/bds/command"
import { TextPacket } from "bdsx/bds/packets"
import { Player } from "bdsx/bds/player"
import { command } from "bdsx/command"
import { events } from "bdsx/event"
import { bool_t, CxxString } from "bdsx/nativetype"
import * as fs from "fs"
import * as path from "path"

let pos1: Map<Player, Vec3> = new Map<Player, Vec3>()

let pos2: Map<Player, Vec3> = new Map<Player, Vec3>()

const range = (start: number, end: number) => Array.from({length: (end - start)}, (v, k) => k + start);

events.serverOpen.on(() => {
    if (!fs.existsSync(path.join(__dirname, "../world"))) return fs.mkdirSync(path.join(__dirname, "../world"))
})

let cmd = command.register("jsonworld", "Convert World To JsonWorld", CommandPermissionLevel.Operator)

cmd.overload((p, o) => {
    const player = o.getEntity() as Player
    if (!(player instanceof Player)) return false
    pos1.set(player, player.getFeetPos())
    sendMessage(player, "Set pos1")
    return true
}, {
    mode: command.enum("jsonworld.pos1", "pos1")
})

cmd.overload((p, o) => {
    const player = o.getEntity() as Player
    if (!(player instanceof Player)) return false
    pos2.set(player, player.getFeetPos())
    sendMessage(player, "Set pos2")
}, {
    mode: command.enum("jsonworld.pos2", "pos2")
})

cmd.overload((p, o) => {
    const player = o.getEntity() as Player
    if (!(player instanceof Player)) return false
    let ph = path.join(__dirname, `../world/${p.filename}.json`)
    if (pos1.get(player) == null) {
        sendMessage(player, "pos1 is null")
        return false
    }
    if (pos2.get(player) == null) {
        sendMessage(player, "pos2 is null")
        return false
    }
    fs.writeFileSync(ph, "")
    fs.appendFileSync(ph, `{"json_world":[`)
    let poss1 = pos1.get(player)
    let poss2 = pos2.get(player)
    let x1 = Math.floor(Math.min(poss1?.x as number, poss2?.x as number))
    let x2 = Math.floor(Math.max(poss1?.x as number, poss2?.x as number))
    let y1 = Math.floor(Math.min(poss1?.y as number, poss2?.y as number))
    let y2 = Math.floor(Math.max(poss1?.y as number, poss2?.y as number))
    let z1 = Math.floor(Math.min(poss1?.z as number, poss2?.z as number))
    let z2 = Math.floor(Math.max(poss1?.z as number, poss2?.z as number))
    for(let x of range(x1, x2)) {
        for(let y of range(y1, y2)) {
            for(let z of range(z1, z2)) {
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
    for (let block of blocks) {
        let objBlock = block
        let blockId = objBlock.block_id
        let blockData = objBlock.block_data
        let pos = objBlock.position
        let x = pos.x
        let y = pos.y
        let z = pos.z
        if (y>=500) continue
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
