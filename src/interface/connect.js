const ethers = require("ethers");
const truffleConfig = require("../../truffle-config");

const url = `http://${truffleConfig.networks.development.host}:${truffleConfig.networks.development.port}`;
const provider = new ethers.JsonRpcProvider(url);
const wallet = provider.getSigner(0)

module.exports = { provider, wallet };