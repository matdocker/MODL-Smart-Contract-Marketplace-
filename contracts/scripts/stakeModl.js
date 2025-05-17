// scripts/stakeModl.js
const { ethers } = require("hardhat");

const MODL_TOKEN_ADDRESS = "0x65ad3a43Fe02737772Ea04e4d66787e41BD82972"; // replace with real token address
const STAKING_CONTRACT_ADDRESS = "0xFE4d0dc42617e4B28AB5c92970Ec62C8cf408299"; // replace with real staking contract

const AMOUNT_TO_STAKE = ethers.parseUnits("10000", 18);

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("👤 Using account:", signer.address);

  const modlToken = await ethers.getContractAt("IERC20", MODL_TOKEN_ADDRESS, signer);
  const balance = await modlToken.balanceOf(signer.address);
  console.log("📊 MODL Balance:", ethers.formatUnits(balance, 18));

  const allowance = await modlToken.allowance(signer.address, STAKING_CONTRACT_ADDRESS);
  console.log("🔑 Allowance:", ethers.formatUnits(allowance, 18));

  const approveTx = await modlToken.approve(STAKING_CONTRACT_ADDRESS, AMOUNT_TO_STAKE);
  await approveTx.wait();
  console.log("✅ Approved");

  const STAKING_ABI = ["function stake(uint256 amount) external"];
  const stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, signer);

 try {
    // Simulate the stake function call
    await stakingContract.stake.staticCall(AMOUNT_TO_STAKE);
    console.log("✅ callStatic stake succeeded — safe to send tx");

    // Send the actual transaction
    const stakeTx = await stakingContract.stake(AMOUNT_TO_STAKE);
    await stakeTx.wait();
    console.log("✅ Successfully staked 10,000 MODL");
    } catch (err) {
    // Handle errors and provide detailed feedback
    if (err.code === 'CALL_EXCEPTION') {
        console.error("❌ callStatic stake failed: CALL_EXCEPTION");
        console.error("Reason:", err.reason || "No revert reason provided");
    } else {
        console.error("❌ callStatic stake failed:", err);
    }
    }

}


main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});