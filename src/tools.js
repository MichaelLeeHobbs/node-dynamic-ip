const fetch = require('node-fetch')
const SECOND = 1000 // 1000 ms
const MINUTE = 60 * SECOND // 1000 ms

const generateURL = ({service, user, password, hostname, ipv4addr, ipv6addr}) => {
    const {proto, host, path} = service
    const urlArr = [`${proto}://${user}:${password}@${host}${path}${hostname}`]
    if (ipv4addr) urlArr.push(`myip=${ipv4addr}`)
    if (ipv6addr) urlArr.push(`myip6=${ipv6addr}`)
    return urlArr.join('&')
}

const getExternalIPv4 = async ({url = 'http://myexternalip.com/raw', skip} = {}) => {
    if (skip) return {ipv4addr: undefined}
    return fetch(url)
        .then(res => res.text())
        .then(result => ({ipv4addr: result}))
        .catch(ipv4error => ({ipv4addr: undefined, ipv4error}))
}
const getExternalIPv6 = async ({url = 'http://checkipv6.dyndns.com/', skip} = {}) => {
    if (skip) return {ipv6addr: undefined}
    const regex = /(?<ipv6addr>(?:[0-9a-f]{4,}:)+[0-9a-f]{4,})/
    return fetch(url)
        .then(res => res.text())
        .then(result => {
            const match = regex.exec(result)
            return {ipv6addr: match ? match.ipv6addr : undefined}
        })
        .catch(ipv6error => ({ipv6addr: undefined, ipv6error}))
}

const getExternalIPs = async ({ipv4skip = false, ipv6skip = false} = {}) => {
    const promises = []
    if (!ipv4skip) promises.push(getExternalIPv4())
    if (!ipv6skip) promises.push(getExternalIPv4())
    return Promise.all(promises)
        .then(results => results.reduce((acc, cur) => ({...acc, ...cur}), {}))
}


const updateIPOld = async ({user, password, hostname, service, ipv4, ipv6}) => {
    getExternalIPs({ipv4skip: ipv4 === 'no', ipv6skip: ipv6 === 'no'})
        .then(({ipv4addr, ipv4error, ipv6addr, ipv6error}) => {
            console.log({ipv4addr, ipv4error, ipv6addr, ipv6error})
            if (ipv4 === 'yes' && ipv4error) throw new Error(ipv4error)
            if (ipv6 === 'yes' && ipv6error) throw new Error(ipv6error)

            const url = generateURL({service, user, password, hostname, ipv4addr, ipv6addr})
            const headers = {
                'user-agent': 'no-ip shell script/1.0 mail@mail.com',
                'Authorization': Buffer.from(`${user}:${password}`).toString('base64')
            }
            console.log(url, headers)
        })
}

const parseUpdateResult = ({result, httpStatus}) => {
    const statusMap = {
        'good': {status: 'good', message: `DNS hostname update successful.`},
        'nochg': {status: 'nochg', message: `IP address is current, no update performed.`},
        'nohost': {status: 'nohost', error: 'Hostname supplied does not exist under specified account, client exit and require user to enter new login credentials before performing an additional request.'},
        'badauth': {status: 'badauth', error: 'Invalid username password combination.'},
        'badagent': {status: 'badagent', error: 'Client disabled.'},
        '!donator': {status: '!donator', error: 'An update request was sent, including a feature that is not available to that particular user such as offline options.'},
        'abuse': {status: 'abuse', error: 'Username is blocked due to abuse.'},
        '911': {status: '911', error: 'A fatal error on our side such as a database outage. Retry the update no sooner than 30 minutes.', retry: 30 * MINUTE},
    }
    if (httpStatus === 500) return {status: '911', statusText: statusMap['911']}
    const [status, ip = ''] = result.trim().split(' ')
    const [ipv4addr, ipv6addr] = ip.split(',')
    return {...statusMap[status], ipv4addr, ipv6addr}
}

const updateIP = async ({user, password, hostname, service, ipv4addr, ipv6addr}) => {


    const url = generateURL({service, user, password, hostname, ipv4addr, ipv6addr})
    const headers = {
        'user-agent': 'no-ip shell script/1.0 mail@mail.com',
        'Authorization': `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`
    }
    return fetch(url, {headers})
        .then(async (res) => ({httpStatus: res.status, ...parseUpdateResult({result: await res.text(), httpStatus: res.status})}))
}
module.exports = {
    getExternalIPv4,
    getExternalIPv6,
    getExternalIPs,
    generateURL,
    updateIP
}
// getExternalIPv4()
//     .then(({ipv4addr}) => {
//         updateIP({user: 'michaelleehobbs', password: '@AK79ax7574@', hostname: 'test-ndip.zapto.org', service: 'noip', ipv4addr: ipv4addr + 1})
//             .then(console.log)
//     })


