const services = {
    noip: {name: 'noip', proto: 'https', host: 'dynupdate.no-ip.com', path: '/nic/update?hostname=', keepAlive: 1}, // keep alive is actually 30 but we use 1 to be safe
    dyndns: {name: 'dyndns', proto: 'https', host: 'members.dyndns.org', path: '/v3/update?hostname=', keepAlive: 1},
    duckdns: {name: 'duckdns', proto: 'https', host: 'www.duckdns.org', path: '/v3/update?hostname=', keepAlive: 1},
    google: {name: 'google', proto: 'https', host: 'domains.google.com', path: '/nic/update?hostname=', keepAlive: 1},
    freedns: {name: 'freedns', proto: 'https', host: 'freedns.afraid.org', path: '/nic/update?hostname=', keepAlive: 1},
}

module.exports = services
