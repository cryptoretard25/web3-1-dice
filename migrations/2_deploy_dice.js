const Dice = artifacts.require("Dice");
const ERC20Token = artifacts.require("ERC20Token");

module.exports = async function (deployer) {
  const diceTokenInstance = await ERC20Token.deployed();
  await deployer.deploy(Dice, diceTokenInstance.address);
};
