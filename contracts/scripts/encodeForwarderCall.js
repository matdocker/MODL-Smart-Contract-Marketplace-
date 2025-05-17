const { ethers } = require('ethers');

async function encode() {
  const forwarderAddress = '0x9D630077D10272936cB368D1eE370a3Ec2b20704'; // Trusted Forwarder
  const deploymentManagerAddress = '0xBC7e41034c028724de34C7AeE97De6758fae8761'; // DeploymentManager proxy
  const userAddress = '0x52F7B438B3C72d9a834FE7CBc00D78E948d706D5';
  const projectId = 55;

  const deploymentManagerIface = new ethers.utils.Interface([
    "function deleteProject(uint256 projectId)"
  ]);

  const forwarderIface = new ethers.utils.Interface([
    "function execute(address target, bytes data, address user)"
  ]);

  const encodedTargetData = deploymentManagerIface.encodeFunctionData("deleteProject", [projectId]);
  
  const encodedForwarderData = forwarderIface.encodeFunctionData("execute", [
    deploymentManagerAddress,
    encodedTargetData,
    userAddress
  ]);

  console.log("✅ Encoded Forwarder Data:", encodedForwarderData);
}

encode();
