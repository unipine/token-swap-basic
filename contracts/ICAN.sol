// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../libraries/token/ERC20/extensions/IERC20Metadata.sol";

interface ICAN is IERC20Metadata {
  function decimals() external view returns (uint8);
  function rates() external view returns (uint8);
}
