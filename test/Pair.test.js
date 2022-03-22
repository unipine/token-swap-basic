const Pair = artifacts.require('./Pair.sol');
const Swap = artifacts.require('./Swap.sol');
const CAN01 = artifacts.require('./CAN01.sol');
const CAN02 = artifacts.require('./CAN02.sol');

contract("Pair", ([admin, buyer]) => {
  var pair, swap;
  var can01, can02;
  var pairAddress;
  var ether1 = 1000000000000000000;

  describe("Test", () => {
    it("Deployment", () => {
      return Pair.deployed().then(async instance => {
        pair = instance;
        can01 = await pair.can01();
        can02 = await pair.can02();
        pairAddress = await pair.address;
        assert.equal(await pair.name(), "CAN01 & CAN02 Pair", "> Pair deployed");
      }).then(() => {
        return Swap.deployed().then(async instance => {
          swap = instance;
          assert.equal(await swap.fee(), '3', "> Swap deployed");
        })
      })
    })

    it("Buy CAN01", () => {
      return pair.buy(can01, 10, { from: buyer, value: ether1 }).then(result => {
        assert.equal(result.logs.length, 1, '> Triggered an event');
        assert.equal(result.logs[0].event, 'BuyToken', '> Event "BuyToken"');
        assert.equal(result.logs[0].args[0], buyer, '> Buyer address match');
        assert.equal(result.logs[0].args[1], can01, '> Token address match');
        assert.equal(result.logs[0].args[2], 10, '> Token amount match');
      });
    })

    it("Buy CAN02", () => {
      return pair.buy(can02, 20, { from: buyer, value: ether1 }).then(result => {
        assert.equal(result.logs.length, 1, '> Triggered an event');
        assert.equal(result.logs[0].event, 'BuyToken', '> Event "BuyToken"');
        assert.equal(result.logs[0].args[0], buyer, '> Buyer address match');
        assert.equal(result.logs[0].args[1], can02, '> Token address match');
        assert.equal(result.logs[0].args[2], 20, '> Token amount match');
      });
    })

    it("Swap", () => {
      return swap.swapToken(can01, can02, pairAddress, 1, { from: buyer }).then(result => {
        assert.equal(result.logs.length, 2, '> Triggered two events');
        assert.equal(result.logs[0].event, 'ExpectedExchangeAmount', '> Event "ExpectedExchangeAmount"');
        assert.ok(result.logs[0].args[0], `> Exchange amount ${result.logs[0].args[0]}`);

        assert.equal(result.logs[1].event, 'SwapFinished', '> Event "SwapFinished"');
        assert.equal(result.logs[1].args[0], buyer, '> Buyer address match');
        assert.equal(result.logs[1].args[1], can01, '> Token address match');
        assert.equal(result.logs[1].args[2], can02, '> Token address match');
        assert.equal(result.logs[1].args[3], 1, '> Token amount match');
        assert.equal(result.logs[1].args[4].toNumber(), result.logs[0].args[0].toNumber(), '> Exchange amount match');
      });
    })
  })
})