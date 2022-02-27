//SPDX-License-Identifier: MIT 
pragma solidity >=0.8.0 <0.9.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DEX {

     //VARIABLES
     using SafeMath for uint256;
     IERC20 token;

     uint256 public totalLiquidity;
     mapping (address => uint256) public liquidity; //track who added liquidty and how much

     //MODIFIERS
     modifier liquidityTresholdMet(uint256 tokens) {
          if(tokens > 0 && msg.value > 0) {
               _;
          }
     }
     //EVENTS


     //Functions
     constructor(address token_addr) public {
          token = IERC20(token_addr);
     }


     function init(uint256 tokens) public payable returns (uint256) {
          require(totalLiquidity==0, "dex already has liquidity");
          totalLiquidity = address(this).balance;
          liquidity[msg.sender] = totalLiquidity;
          require(token.transferFrom(msg.sender, address(this), tokens));
          return totalLiquidity;
     }

     function price(uint256 input_amount, uint256 input_reserve, uint256 output_reserve) public view returns (uint256) {
          uint256 input_amount_with_fees = input_amount.mul(997);
          uint256 numerator = input_amount_with_fees.mul(output_reserve);
          uint256 denominator = (input_reserve.mul(1000)).add(input_amount_with_fees);
          return numerator / denominator;
     }

     function ethToToken() public payable returns (uint256) {
          uint256 token_reserve = token.balanceOf(address(this));
          uint256 token_bought = price(msg.value, address(this).balance.sub(msg.value), token_reserve);
          require(token.transfer(msg.sender, token_bought));
          return token_bought;
     }

     function tokenToEth(uint256 tokens) public payable returns (uint256) {
          uint256 token_reserve = token.balanceOf(address(this));
          uint256 eth_bought = price(tokens, token_reserve, address(this).balance);
          (bool sent, bytes memory data) = payable(msg.sender).call{value: eth_bought}("");
          require(sent, "failed to send ether");
          require(token.transferFrom(msg.sender, address(this), tokens));
          return eth_bought;
     }

     function deposit() public payable returns (uint256) {
          uint256 eth_reserve = address(this).balance.sub(msg.value);
          uint256 token_reserve = token.balanceOf(address(this));
          uint256 token_amount = (msg.value.mul(token_reserve) / eth_reserve).add(1);
          uint256 liquidity_minted = msg.value.mul(totalLiquidity) / eth_reserve;
          liquidity[msg.sender] = liquidity[msg.sender].add(liquidity_minted);
          require(token.transferFrom(msg.sender, address(this), token_amount));
          return liquidity_minted;
     }

     function withdraw(uint256 amount) public returns (uint256, uint256) {
          uint256 token_reserve = token.balanceOf(address(this));
          uint256 eth_amount = amount.mul(address(this).balance) / totalLiquidity;
          uint256 token_amount = amount.mul(token_reserve) / totalLiquidity;
          liquidity[msg.sender] = liquidity[msg.sender].sub(eth_amount);
          (bool sent, bytes memory data) = payable(msg.sender).call{value: eth_amount}("");
          require(sent, "failed to send ether");
          require(token.transfer(msg.sender, token_amount));
          return (eth_amount, token_amount);
     }

}