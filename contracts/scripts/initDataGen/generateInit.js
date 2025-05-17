// generateInit.js
const { ethers } = require("ethers");

const iface = new ethers.Interface([
  "function initialize(address modlToken, address trustedForwarder)"
]);

const modlToken = "0x06575CC82c1c86A5da41F14178777c97b7a005EF";            // Replace this
const trustedForwarder = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"; // Replace this

const data = iface.encodeFunctionData("initialize", [modlToken, trustedForwarder]);
console.log("Encoded init data:", data);
