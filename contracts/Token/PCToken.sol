// SPDX-License-Identifier: TBC

pragma solidity ^0.6.0;

import "./ERC20.sol";

// PharmaChainToken (PCToken)
contract PCToken is ERC20 {
    uint constant _initial_supply = 2100000000;
    string constant _name = "PharmaChainToken";
    string constant _symbol = "PCT";

    address payable public owner;

    constructor() public payable ERC20(_name, _symbol){
        owner = msg.sender;
        _mint(msg.sender, _initial_supply);
    }

    // Modifier to check if caller is the Owner
    modifier isOwner() {
        require(msg.sender == owner, "Caller is not the Owner");
        _;
    }

    // Earn tokens when a User purchases Products
    function earnTokensOnPurchase(address _recipient, uint256 _amount) external isOwner {
        approve(owner, _amount);
        transferFrom(owner, _recipient, _amount);
    }
}
