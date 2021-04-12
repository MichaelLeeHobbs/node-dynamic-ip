const debug = require('debug')
const EventEmitter = require('events')
const services = require('./services')
const {getExternalIPv4, getExternalIPv6, updateIP} = require('./tools')
const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const IP_INTERVAL = MINUTE

class DynamicIP extends EventEmitter {
    constructor(config) {
        super()
        const {service, user, password, hostname, ipv4required = 'yes', ipv6required = 'no'} = config
        this._debug = debug(`DynamicIP:${hostname}`)
        this.config = config

        this._state = {
            ipv4addr: undefined,
            ipv6addr: undefined,
            retryDT: new Date(),
            status: undefined,
            updateDT: new Date()
        }

        this._debug('constructor', JSON.stringify({service, user, password: `${password.slice(0, 3)}...`, hostname, ipv4required, ipv6required}))
        this._handlers = {}
    }

    update({ipv4addr, ipv6addr}) {
        const $debug = (msg, data = {}) => this._debug(msg, JSON.stringify(data))
        const {user, password, hostname, updateDT} = this // we need the raw _keepAlive value ie in ms not days
        const service = this.serviceConfig
        const now = new Date()
        const keepAliveDT = new Date((new Date()).setMilliseconds(updateDT.getMilliseconds() + (service.keepAlive * DAY)))
        const cState = {update: {ipv4addr, ipv6addr}, current: {ipv4addr: this.ipv4addr, ipv6addr: this.ipv6addr}, now: now.toISOString(), updateDT: updateDT.toISOString(), keepAliveDT: keepAliveDT.toISOString(), retryDT: this.retryDT}
        cState.ipv4HasUpdate = (!!ipv4addr && ipv4addr !== this.ipv4addr)
        cState.ipv6HasUpdate = (!!ipv6addr && ipv6addr !== this.ipv6addr)
        cState.keepAliveHasUpdate = keepAliveDT < now
        cState.hasUpdate = cState.ipv4HasUpdate || cState.ipv6HasUpdate || cState.keepAliveHasUpdate

        $debug('update', cState)
        if (!cState.hasUpdate) return

        if (now < this.retryDT) {
            $debug('update:updateSkippedRetry', cState)
            return this.emit('updateSkippedRetry', {retryDT: this.retryDT})
        }

        this.status = `Updating...`
        updateIP({user, password, hostname, service, ipv4addr, ipv6addr})
            .then((result) => {
                const {status, message, error, retry} = result
                $debug('update:updateIP:result', {...cState, result})
                if (retry) {
                    $debug('update:updating:error')
                    this.status = 'In retry!'
                    this.retryDT = retry
                    return this.emit('error', {error, status, retryDT: this.retryDT})
                }
                if (error) {
                    $debug('update:updating:fatalError')
                    this.status = `Fatal Error! ${error?.message || error}`
                    this.emit('fatalError', {error})
                    return this.stop()
                }
                if (ipv4addr) this.ipv4addr = ipv4addr
                if (ipv6addr) this.ipv6addr = ipv6addr

                this.updateDT = now
                this.status = status ? `${status} - ${message}` : 'Updated'
                $debug('update:complete', this.status)
            })
    }

    start() {
        this._debug('start')
        if (this._ipv4required !== 'no') this.startIpv4()
        if (this._ipv6required !== 'no') this.startIpv6()
    }

    stop() {
        this._debug('stop')
        clearInterval(this._handlers.updateCountHandler)
        this.stopIpv4()
        this.stopIpv6()
    }

    startIpv4() {
        const handler = async () => {
            const {ipv4addr, ipv4error} = await getExternalIPv4()
            if (ipv4error) return this.emit('ipv4error', {ipv4error})
            this.update({ipv4addr})
        }
        this._debug('startIpv4')
        this._handlers.ipv4handler = setInterval(handler, IP_INTERVAL)
        // run once at start
        handler()
    }

    stopIpv4() {
        this._debug('startIpv4')
        clearInterval(this._handlers.ipv4handler)
    }

    startIpv6() {
        this._debug('startIpv6')
        const handler = async () => {
            const {ipv6addr, ipv6error} = await getExternalIPv6()
            if (ipv6error) return this.emit('ipv4error', {ipv6error})
            this.update({ipv6addr})
        }
        this._handlers.ipv6handler = setInterval(handler, IP_INTERVAL)
        handler()
    }

    stopIpv6() {
        this._debug('stopIpv6')
        clearInterval(this._handlers.ipv6handler)
    }

    get service() {
        return this._service?.name
    }

    get serviceConfig() {
        return this._service
    }

    set service(name) {
        if (!services[name]) throw new Error(`Unknown Service! ${name}`)
        this._service = services[name]
    }

    get user() {
        return this._user
    }

    set user(user) {
        if (!user) throw new Error('"user" cannot be undefined or null!')
        this._user = user
    }

    get password() {
        return this._password
    }

    set password(password) {
        if (!password) throw new Error('"password" cannot be undefined or null!')
        this._password = password
    }

    get hostname() {
        return this._hostname
    }

    set hostname(hostname) {
        if (!hostname) throw new Error('"hostname" cannot be undefined or null!')
        this._hostname = hostname
    }

    get ipv4required() {
        return this._ipv4required
    }

    set ipv4required(value) {
        if (!['yes', 'no', 'optional'].includes(value)) throw new Error('ipv4required must be one of "yes", "no", "optional".')
        this._ipv4required = value
    }

    get ipv6required() {
        return this._ipv6required
    }

    set ipv6required(value) {
        if (!['yes', 'no', 'optional'].includes(value)) throw new Error('ipv6required must be one of "yes", "no", "optional".')
        this._ipv6required = value
    }

    get ipv4addr() {
        return this._state.ipv4addr
    }

    set ipv4addr(ipv4addr) {
        this._state.ipv4addr = ipv4addr
        if (ipv4addr !== this._state.ipv4addr) this.emit('ipv4addr', {ipv4addr})
    }

    get ipv6addr() {
        return this._state.ipv6addr
    }

    set ipv6addr(ipv6addr) {
        this._state.ipv6addr = ipv6addr
        if (ipv6addr !== this._state.ipv6addr) this.emit('ipv6addr', {ipv6addr})
    }

    get status() {
        return this._state.status
    }

    set status(status) {
        this.emit('status', {status})
        this._state.status = status
    }

    get retryDT() {
        return this._state.retryDT
    }

    set retryDT(minutes) {
        const now = new Date()
        this._state.retryDT = new Date(now.setMilliseconds(now.getMilliseconds() + minutes * MINUTE))
    }

    get updateDT() {
        return this._state.updateDT
    }

    set updateDT(date) {
        this._state.updateDT = date
    }

    get config() {
        return this._config
    }

    set config(config) {
        const {service, user, password, hostname, ipv4required = 'yes', ipv6required = 'no'} = config
        this.service = service
        this.user = user
        this.password = password
        this.hostname = hostname
        this.ipv4required = ipv4required
        this.ipv6required = ipv6required
        this._config = {service, user, password, hostname, ipv4required, ipv6required}
    }
}

module.exports = DynamicIP





