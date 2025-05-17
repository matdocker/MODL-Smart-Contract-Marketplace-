const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MockTemplateFactory", function () {
    it("should increment deploymentCount", async function () {
      const [deployer] = await ethers.getSigners();
      const MockTemplateFactory = await ethers.getContractFactory("MockTemplateFactory");
      const factory = await MockTemplateFactory.deploy();
      await factory.waitForDeployment();
  
      // Initially, deploymentCount should be 0
      expect((await factory.deploymentCount()).toString()).to.equal("0");
  
      // Call deployTemplate and expect deploymentCount to increment to 1.
      await factory.deployTemplate(ethers.id("someTemplate"), "0x");
      expect((await factory.deploymentCount()).toString()).to.equal("1");
    });
  });
  