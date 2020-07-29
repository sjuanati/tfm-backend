// SPDX-License-Identifier: TBC

pragma solidity ^0.6.2;

import "./ERC20.sol";

// PharmaChainToken (PCT)
contract PCToken is ERC20 {

    uint constant _initial_supply = 2000000000 * (10 ** uint256(18));
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
        require(_amount > 0, "Amount must be greater than 0");

        // Earn 2,5% if amount spent is <=20 EUR, 5% if amount spent is <=50 EUR and 10% if amount spent is > 50 EUR
        uint256 result;
        if (_amount <= 20) {
            result = _amount.mul(25).div(1000);
        } else if (_amount <= 50) {
            result = _amount.mul(50).div(1000);
        } else if (_amount > 50) {
            result = _amount.mul(100).div(1000);
        }

        approve(owner, result);
        transferFrom(owner, _recipient, result);
    }

    // function earnTokensFromLab()

    // function spendTokensOnPurchase()
}
