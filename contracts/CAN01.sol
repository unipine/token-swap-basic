// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../libraries/token/ERC20/ERC20.sol";

contract CAN01 is ERC20 {
  uint8 public rate;

  constructor(uint8 _rate) ERC20("Canicula Token01 v1.0", "CAN01") {
    rate = _rate;
    uint256 totalSupply_ = (10000 * (10 ** decimals()));
    _mint(msg.sender, totalSupply_);
  }

  function rates() public view returns (uint) {
    return rate;
  }
}