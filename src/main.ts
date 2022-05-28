import { Block } from "bdsx/bds/block"
import { BlockPos, Vec3 } from "bdsx/bds/blockpos"
import { TextPacket } from "bdsx/bds/packets"
import { Player } from "bdsx/bds/player"
import { command } from "bdsx/command"
import { bool_t, CxxString } from "bdsx/nativetype"
import * as fs from "fs"
import * as path from "path"
import { Path } from "typescript"

let pos1: Map<Player, Vec3> = new Map<Player, Vec3>()

let pos2: Map<Player, Vec3> = new Map<Player, Vec3>()

command.register("jsonworld", "Convert World To JsonWorld").overload((param, origin) => {
    const player = origin.getEntity() as Player
    if (!(player instanceof Player)) return false
    if (!fs.existsSync(path.join(__dirname, "../world"))) return fs.mkdirSync(path.join(__dirname, "../world"))
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
        let ph = path.join(__dirname, `../world/${param.filename}.json`)
        fs.writeFileSync(ph, "")
        fs.appendFileSync(ph, `{"json_world":[`)
        for (let x: number = xMin; x <= xMax; x++) {
            for (let y: number = yMin; y <= yMax; y++) {
                for (let z: number = zMin; z <= zMax; z++) {
                    let block = player.getDimension().blockSource.getBlock(BlockPos.create(x, y, z))
                    let blockId = block.getDescriptionId().replace("tile.", "minecraft:")
                    if (blockId === "minecraft:air" && save_air2 === false) continue
                    console.log("Saveing block: " + blockId + " at " + x + " " + y + " " + z)
                    fs.appendFileSync(ph, `{"block_id":"${blockId}","block_data":${block.data},"position":{"x":${x},"y":${y},"z":${z}}},`)
                    sendMessage(player, `Saving block ${blockId} at ${x} ${y} ${z}`)
                }
            }
        }
        sendMessage(player, `Saving world to ${ph}`)
        fs.appendFileSync(ph, `{"block_id":"OhmFn X2","block_data":69,"position":{"x":0,"y":500,"z":0}}]}`)
        return true
    }
    if (param.mode === "load") {
        sendMessage(player, "Loading...")
        let ph = path.join(__dirname, `../world/${param.filename}.json`)
        if (!fs.existsSync(ph)) return sendMessage(player, "File not found")
        let wI:number = 0
        let wRun: boolean = true
        while (wRun == true) {
            callbackFun(() => {
                let worldfile = JSON.parse(fs.readFileSync(ph).toString()).json_world[wI]
                if (worldfile == null) {
                    wRun = false
                    return
                }
                let blockPos = BlockPos.create(worldfile.position.x, worldfile.position.y, worldfile.position.z)
                let blockId = worldfile.block_id
                let blockData = worldfile.block_data
                if (blockId === "minecraft:air" && save_air2 === false) return
                if (blockPos.y >= 500) return
                console.log(`Loading block ${blockId} at ${blockPos.x} ${blockPos.y} ${blockPos.z}`)
                sendMessage(player, `Loading block ${blockId} at ${blockPos.x} ${blockPos.y} ${blockPos.z}`)
                player.getDimension().blockSource.setBlock(blockPos, Block.create(blockId, blockData) as Block)
            })
            wI++
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

function callbackFun(_callback: Function) {
    _callback()
}