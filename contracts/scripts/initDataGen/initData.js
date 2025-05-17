// initData.js

// We use a pure Node.js script that imports ethers directly.
const { getAddress, Interface } = require("ethers");

// Define the ABI for the initializer function.
const initABI = [
  "function initialize(address recipient, address initialOwner, string tokenName, string tokenSymbol, uint256 mintAmount)"
];

// Create an Interface instance.
const iface = new Interface(initABI);

// Use an all‑lowercase version of the address to ensure proper checksum conversion.
const rawAddress = "0x52f7b438b3c72d9a834fe7cbc00d78e948d706d5";
const initialOwner = getAddress(rawAddress);

const tokenName = "ERC20Template";
const tokenSymbol = "E20T";
const mintAmount = "1000000";
const recipient = initialOwner;


// Encode the initializer call.
const initData = iface.encodeFunctionData("initialize", [recipient, initialOwner, tokenName, tokenSymbol, mintAmount]);

console.log("Encoded initData:", initData);
