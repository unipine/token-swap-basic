var Pair = artifacts.require("./Pair.sol");

module.exports = function(deployer) {
  deployer.deploy(Pair);
};
