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

    // Earn tokens by purchasing products
    function earnTokensOnPurchase(address _recipient, uint256 _amount) external isOwner {
        approve(owner, _amount);
        transferFrom(owner, _recipient, _amount);
    }

    // TODO**************************
    // A is PharmaChain as meta-transactor, B is Purchaser (uses tokens to pay), C is Receiver (receives tokens)
    // Spend tokens to purchase products (pay products using tokens instead of fiat)
    function spendTokensOnPurchase(address _recipient, uint256 _amount) external isOwner {

    }
}
