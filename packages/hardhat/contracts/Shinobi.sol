//SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Shinobi is ERC20 {
    constructor() ERC20("Shinobi", "SNB") {
        _mint(msg.sender, 1000 ether);
    }
}