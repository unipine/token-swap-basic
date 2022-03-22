// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./CAN01.sol";
import "./CAN02.sol";
import "./ICAN.sol";

contract Pair {
  address private pair;
  string public name;
  uint256 public fee;
  CAN01 public can01;
  CAN02 public can02;
  uint public totalSwaps;
  uint public totalBuys;

  mapping(uint => SwapLog) public swapLogs;
  mapping(uint => BuyLog) public buyLogs;

  event SwapFinished(
    address user,
    address indexed token1,
    address indexed token2,
    uint256 amount1,
    uint256 amount2
  );
  event BuyToken(
    address indexed user,
    address indexed token,
    uint256 amount
  );
  event ExpectedExchangeAmount(uint256 amount);

  struct SwapLog {
    address user;
    address token1;
    address token2;
    uint256 amount1;
    uint256 amount2;
  }

  struct BuyLog {
    address user;
    address token;
    uint256 amount;
  }

  constructor() {
    name = "CAN01 & CAN02 Pair";
    fee = 3;
    pair = address(this);
    can01 = new CAN01(10);
    can02 = new CAN02(20);
  }

  function swap(address _token1, address _token2, uint256 amount) public {
    require(amount > 0, "PAIR: amount is zero");

    ICAN token1 = ICAN(_token1);
    ICAN token2 = ICAN(_token2);

    amount = amount * (10 ** token1.decimals()) / token1.rates();

    uint256 exchangeAmount = calcAmount(token1, token2, amount);
    address buyer = msg.sender;

    emit ExpectedExchangeAmount(exchangeAmount);

    require(
      token1.balanceOf(buyer) >= amount,
      "PAIR: token1 balance is low"
    );
    require(
      exchangeAmount > 0,
      "PAIR: exchangeAmount is zero"
    );
    require(
      token2.balanceOf(pair) >= exchangeAmount,
      "PAIR: token2 balance is low"
    );

    token1.approve(pair, amount);
    token1.transferFrom(buyer, pair, amount);
    token2.transfer(buyer, exchangeAmount);

    totalSwaps++;
    swapLogs[totalSwaps] = SwapLog(
      buyer,
      address(token1),
      address(token2),
      amount,
      exchangeAmount
    );

    emit SwapFinished(
      buyer,
      address(token1),
      address(token2),
      amount,
      exchangeAmount
    );
  }

  function buy(address _token, uint256 amount) public payable {
    ICAN token = ICAN(_token);
    address buyer = msg.sender;

    require(_token != address(0), "PAIR: token is not valid");
    require(amount >= 0, "PAIR: amount is zero");

    amount = amount * (10 ** token.decimals()) / token.rates();

    require(token.balanceOf(pair) >= amount, "PAIR: balance is low");
    require(msg.value >= amount, "PAIR: value is low");

    token.transfer(buyer, amount);

    totalBuys++;
    BuyLog memory newLog = BuyLog(buyer, address(token), amount);
    buyLogs[totalBuys] = newLog;

    emit BuyToken(buyer, address(token), amount * token.rates() / (10 ** token.decimals()));
  }

  function calcAmount(
    ICAN token1,
    ICAN token2,
    uint256 amount
  ) private view returns (uint256) {
    uint8 rate1 = token1.rates();
    uint8 rate2 = token2.rates();
    uint8 ratio;
    uint256 worth;
    uint256 exchangeAmount;

    if (rate1 <= rate2) {
      ratio = uint8(rate2 / rate1);
      worth = uint256(ratio * amount);
      exchangeAmount = uint256(worth - (worth * fee) / 1000);
    } else {
      ratio = uint8(rate1 / rate2);
      worth = uint256(amount / ratio);
      exchangeAmount = uint256(worth - (worth * fee) / 1000);
    }

    return exchangeAmount;
  }

  function balanceOf() public view returns (uint256 _can01, uint256 _can02) {
    return (can01.balanceOf(pair), can02.balanceOf(pair));
  }

  function getLogCount() public view returns (uint buys, uint swaps) {
    return (totalBuys, totalSwaps);
  }

  function getBuyLog(uint pos) public view returns (BuyLog memory) {
    return buyLogs[pos];
  }

  function getSwapLog(uint pos) public view returns (SwapLog memory) {
    return swapLogs[pos];
  }
}