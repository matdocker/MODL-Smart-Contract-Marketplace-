/* eslint-env mocha */
const path = require('path');
const fs = require('fs/promises');
const { expect } = require('chai');
const { ethers } = require('hardhat');

let fetch;

/* ------------------------------------------------------------------ */
/*                      small helper – wait for GSN relay             */
/* ------------------------------------------------------------------ */
async function waitForRelay(url, timeoutMs = 30_000) {
  const until = Date.now() + timeoutMs;
  console.log(`⏳ Waiting for relay server at ${url}`);
  while (Date.now() < until) {
    try {
      const res = await fetch(`${url}/getaddr`);
      await res.text();
      if (res.ok) {
        console.log('✅ Relay server ready');
        return;
      }
    } catch (_) {}
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error('Relay not ready');
}

describe('MODLPaymaster (GSN‑ERC20 tiered)', function () {
  this.timeout(60_000);

  let owner, user, relayWorker;
  let modlToken, tierSystem, paymaster;
  let gsn;

  before(async () => {
    fetch = (await import('node-fetch')).default;
    gsn = JSON.parse(await fs.readFile(path.join(__dirname, '..', 'gsn_dev.json'), 'utf8'));
    await waitForRelay(gsn.relayUrl);
  });

  beforeEach(async () => {
    [owner, user, relayWorker] = await ethers.getSigners();

    const MockToken = await ethers.getContractFactory('MockModlToken');
    modlToken = await MockToken.deploy();
    await modlToken.waitForDeployment();

    const TierMock = await ethers.getContractFactory('MockTierSystem');
    tierSystem = await TierMock.deploy();
    await tierSystem.waitForDeployment();
    await tierSystem.setTier(user.address, 2);

    const Paymaster = await ethers.getContractFactory('contracts/MODLPaymaster.sol:MODLPaymaster');
    paymaster = await Paymaster.deploy();
    await paymaster.waitForDeployment();

    await paymaster.initialize(
      owner.address,
      modlToken.target,
      tierSystem.target,
      gsn.forwarder,
      gsn.relayHub
    );
    await paymaster.setRelayHub(gsn.relayHub);

    const hub = await ethers.getContractAt('IRelayHub', gsn.relayHub);
    await hub.depositFor(paymaster.target, { value: ethers.parseEther('1') });

    await modlToken.mint(user.address, ethers.parseEther('1000'));
    await modlToken.connect(user).approve(paymaster.target, ethers.parseEther('1000'));
  });

  function buildRelayRequest(from) {
    const ts = Math.floor(Date.now() / 1_000);
    return {
      request: {
        from,
        to: ethers.ZeroAddress,
        value: 0,
        gas: 100_000,
        nonce: 0,
        data: '0x',
        validUntilTime: ts + 3600
      },
      relayData: {
        maxFeePerGas: ethers.parseUnits('20', 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits('1', 'gwei'),
        gasPrice: 0,
        pctRelayFee: 0,
        baseRelayFee: 0,
        relayWorker: relayWorker.address,
        paymaster: paymaster.target,
        forwarder: gsn.forwarder,
        paymasterData: '0x',
        clientId: 1,
        transactionCalldataGasUsed: 100_000
      }
    };
  }

  it('rejects zero deposit', async () => {
    await expect(
      paymaster.connect(user).depositTokens(0)
    ).to.be.revertedWith('Zero deposit');
  });

  it('allows admin to update min required tier', async () => {
    await paymaster.setMinRequiredTier(3);
    expect(await paymaster.MIN_REQUIRED_TIER()).to.equal(3);
  });

  it('allows admin to update gasToModlRate with cap', async () => {
    const oldRate = await paymaster.gasToModlRate();
    const newRate = oldRate * 2n;
    await paymaster.setGasToModlRate(newRate);
    expect(await paymaster.gasToModlRate()).to.equal(newRate);
  });

  it('allows admin to update tier discounts', async () => {
    await paymaster.setTierDiscount(2, 1500);
    expect(await paymaster.tierDiscountBPS(2)).to.equal(1500);
  });

  it('recovers accidental ERC20 sent to contract', async () => {
    const dust = ethers.parseEther('0.1');
    await modlToken.transfer(paymaster.target, dust);
    const before = await modlToken.balanceOf(owner.address);

    await paymaster.recoverERC20(modlToken.target, owner.address, dust);
    const after = await modlToken.balanceOf(owner.address);
    expect(after - before).to.equal(dust);
  });
});
