# Node Dynamic IP
[![Test Pushes and Pull Request](https://github.com/MichaelLeeHobbs/node-dynamic-ip/actions/workflows/test.yml/badge.svg)](https://github.com/MichaelLeeHobbs/node-dynamic-ip/actions/workflows/test.yml)
[![Publish image](https://github.com/MichaelLeeHobbs/node-dynamic-ip/actions/workflows/publish-image.yml/badge.svg)](https://github.com/MichaelLeeHobbs/node-dynamic-ip/actions/workflows/publish-image.yml)
## Usage
### Config
1. Configuration is via `config.json`. Each element has four properties
   * service: noip/dyndns/duckdns/google/freedns
   * user: username for selected service
   * password: password for selected service
   * hostname: the hostname to be updated on the given service, **MUST** be **unique**!
2. Example: `config.json`
```json
[
    {
        "service": "noip",
        "user": "example",
        "password": "password",
        "hostname": "test-ndip.zapto.org"
    },
    {
        "service": "freedns",
        "user": "example",
        "password": "password",
        "hostname": "test-ndip.chickenkiller.com"
    }
]
```
### Run on Windows
* `docker run -v d:\path\to\config.json:/opt/node-dynamic-ip/config.json:ro michaelleehobbs/node-dynamic-ip:v1.0.1`

### Run on Linux
* `docker run -v /path/to/config.json:/opt/node-dynamic-ip/config.json:ro michaelleehobbs/node-dynamic-ip:v1.0.1`


## Changes
### v1.0.1
* Fixed missing fs-extra package

### v1.0.0
* Init

## Todo
* Publish to NPM
* Added test to catch missing packages

