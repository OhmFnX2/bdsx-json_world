import { Block } from "bdsx/bds/block"
import { BlockPos, Vec3 } from "bdsx/bds/blockpos"
import { TextPacket } from "bdsx/bds/packets"
import { Player } from "bdsx/bds/player"
import { command } from "bdsx/command"
import { bool_t, CxxString } from "bdsx/nativetype"
import * as fs from "fs"
import * as path from "path"

let pos1: Map<Player, Vec3> = new Map<Player, Vec3>()

let pos2: Map<Player, Vec3> = new Map<Player, Vec3>()

command.register("jsonworld", "Convert World To JsonWorld").overload((param, origin) => {
    const player = origin.getEntity() as Player
    if (!(player instanceof Player)) return false
    let save_air2: boolean = param.save_air as boolean
    if(param.save_air == null) save_air2 = false 
    if (param.mode === "pos1") {
        pos1.set(player, player.getFeetPos())
        sendMessage(player, "Set pos1")
        return true
    }
    if (param.mode === "pos2") {
        pos2.set(player, player.getFeetPos())
        sendMessage(player, "Set pos2")
        return true
    }
    if (param.mode === "save") {
        sendMessage(player, "Saving...")
        let pos1p = pos1.get(player) as Vec3
        let pos2p = pos2.get(player) as Vec3
        let xMin: number = 0
        let xMax: number = 0
        let yMin: number = 0
        let yMax: number = 0
        let zMin: number = 0
        let zMax: number = 0
        if (pos1p == null) return sendMessage(player, "Please set pos1 first")
        if (pos2p == null) return sendMessage(player, "Please set pos2 second")
        if (param.filename == null) return sendMessage(player, "Please specify a file name")
        if (Math.floor(pos1p.x) < Math.floor(pos2p.x)) {
            xMin = Math.floor(pos1p.x)
            xMax = Math.floor(pos2p.x)
        } else {
            xMin = Math.floor(pos2p.x)
            xMax = Math.floor(pos1p.x)
        }
        if (Math.floor(pos1p.y) < Math.floor(pos2p.y)) {
            yMin = Math.floor(pos1p.y)
            yMax = Math.floor(pos2p.y)
        } else {
            yMin = Math.floor(pos2p.y)
            yMax = Math.floor(pos1p.y)
        }
        if (Math.floor(pos1p.z) < Math.floor(pos2p.z)) {
            zMin = Math.floor(pos1p.z)
            zMax = Math.floor(pos2p.z)
        } else {
            zMin = Math.floor(pos2p.z)
            zMax = Math.floor(pos1p.z)
        }
        let worldfile = {
            json_world: [
                {
                    block_id: "minecraft:ohmfn_X2",
                    block_data: 0,
                    position: {
                        x: 0,
                        y: 500,
                        z: 0
                    }
                }
            ]
        }
        let ph = path.join(__dirname, `../world/${param.filename}.json`)
        for (let x: number = xMin; x <= xMax; x++) {
            for (let y: number = yMin; y <= yMax; y++) {
                for (let z: number = zMin; z <= zMax; z++) {
                    let block = player.getDimension().blockSource.getBlock(BlockPos.create(x, y, z))
                    let blockId = block.getDescriptionId().replace("tile.", "minecraft:")
                    if (blockId === "minecraft:air" && save_air2 === false) continue
                    worldfile['json_world'].push({
                        block_id: blockId,
                        block_data: block.data,
                        position: {
                            x: x,
                            y: y,
                            z: z
                        }
                    })
                    sendMessage(player, `Saving block ${blockId} at ${x} ${y} ${z}`)
                }
            }
        }
        sendMessage(player, `Saving world to ${ph}`)
        fs.writeFileSync(ph, JSON.stringify(worldfile));
        return true
    }
    if (param.mode === "load") {
        let ph = path.join(__dirname, `../world/${param.filename}.json`)
        if (!fs.existsSync(ph)) return sendMessage(player, "File not found")
        let worldfile = JSON.parse(fs.readFileSync(ph).toString())
        for (let block of worldfile.json_world) {
            let blockPos = BlockPos.create(block.position.x, block.position.y, block.position.z)
            let blockId = block.block_id
            let blockData = block.block_data
            if (blockId === "minecraft:air" && save_air2 === false) continue
            if (blockPos.y >= 500) continue
            player.getDimension().blockSource.setBlock(blockPos, Block.create(blockId, blockData) as Block)
            sendMessage(player, `Loading block ${blockId} at ${blockPos.x} ${blockPos.y} ${blockPos.z}`)
        }
        sendMessage(player, "World loaded")
        return true //code by github copilot & Edit by OhmFn X2
    }
    if (param.mode === "list") {
        let files = fs.readdirSync(path.join(__dirname, "world"))
        let message = "World files: "
        for (let file of files) {
            message += `"${file.replace(".json", "")}", `
        }
        sendMessage(player, message)
        return true //code by github copilot
    }
    if (param.mode == null) {
        sendMessage(player, "Please specify a mode (pos1, pos2, save, load, list)")
        return true
    } //code by github copilot
    return false
}, { mode: CxxString, filename: [CxxString, true], save_air: [bool_t, true]})

function sendMessage(player: Player, message: string, type: TextPacket.Types = 1): void {
    const pk = TextPacket.create()
    pk.type = type
    pk.message = message
    player.sendPacket(pk)
    pk.dispose()
}