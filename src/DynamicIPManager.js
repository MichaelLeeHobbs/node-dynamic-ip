process.env.DEBUG = '*'
const path = require('path')
const chokidar = require('chokidar')
const fs = require('fs-extra')
const DynamicIP = require('./DynamicIP')


class DynamicIPManager {
    constructor(configFilePath) {
        console.log('constructor', configFilePath)
        this._configFilePath = path.resolve(process.cwd(), configFilePath)
        this._hosts = new Map()
        this._handleChokidar = undefined
    }

    async readConfig() {
        const data = await fs.readJson(this._configFilePath)
        const out = []
        if (!Array.isArray(data)) throw new Error(`Invalid config file! Expected JSON array!`)
        data.forEach(host => {
            if (out.some(entry => entry.hostname === host.hostname)) throw new Error(`Duplicate host not allowed! ${host.hostname} appears more than once in config!`)
            out.push(host)
        })
        return out
    }

    async loadConfig() {
        console.log(`loadConfig`)
        const data = await this.readConfig()
        data.forEach(config => {
            console.log(`host config`, config)
            // if (this._hosts.has(host.hostname)) {
            //     const current = this._hosts.get(host.hostname).config
            //     const updated = JSON.stringify(current) !== JSON.stringify(host)
            //     console.log(`${host.hostname} updated? ${updated}`)
            //     if (updated) {
            //         console.log(`Shutting down: ${host.hostname} for updated.`)
            //         current?.stop()
            //         this._hosts.delete(host.hostname)
            //     }
            // }
            // // we check for negative as a way to handle not updated host
            // if (!this._hosts.has(host.hostname)) {
            //     const dynamicIP = new DynamicIP(host)
            //     dynamicIP.start()
            //     this._hosts.set(host.hostname, dynamicIP)
            //
            // }
            if (this._hosts.has(config.hostname)) {
                this._hosts.get(config.hostname).config = config
            } else {
                const dynamicIP = new DynamicIP(config)
                dynamicIP.start()
                this._hosts.set(config.hostname, dynamicIP)
            }
        })
    }

    start() {
        console.log('start', this._configFilePath)
        this.loadConfig()
            .then(()=>{
                console.log('watching config:', this._configFilePath);
                this._handleChokidar = chokidar.watch(this._configFilePath).on('change', (event, path) => {
                    console.log('config updated:', path);
                    this.loadConfig()
                })
            })

    }

    stop() {
        this._handleChokidar?.close()
    }
}

module.exports = DynamicIPManager
