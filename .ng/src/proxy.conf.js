const {target} = require("../config.json");

const PROXY_CONFIG = {
    "/": {
        target,
        secure: false,
        onProxyRes: (proxyRes, req, res) => {
            let cookies =  proxyRes.headers['set-cookie'];
            cookies && cookies.forEach((val, i, arr) => {
                const parts = val.split(";").map(p=>p.trim());
                arr[i] = parts.filter(p=>p.match(/^(?!SameSite|Secure)/i)).join('; ');
            });
            proxyRes.headers['set-cookie'] = cookies;
        }
    }
}

module.exports = PROXY_CONFIG;