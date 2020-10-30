// SPDX-License-Identifier: TBC

pragma solidity ^0.7.0;

import "./ERC20.sol";

// PharmaChainToken (PCT)
contract PCToken is ERC20 {
    uint256 constant _dec = 10**uint256(18);
    uint256 constant _initial_supply = 2000000000 * _dec;
    string constant _name = "PharmaChainToken";
    string constant _symbol = "PCT";

    address payable public owner;

    constructor() public payable ERC20(_name, _symbol) {
        owner = msg.sender;
        _mint(msg.sender, _initial_supply);
    }

    // Modifier to check if caller is the Owner
    modifier isOwner() {
        require(msg.sender == owner, "Caller is not the Owner");
        _;
    }

    // TODO: afegir comissió per la plataforma
    /**
     * @dev Earn tokens when a User purchases Product/s.
     * Such tokens are transferred from the Pharmacy wallet (sender) to the User wallet (recipient)
     * Tokens earned are calculated upon the total purchased amount:
     * - User earns 0.50% of purchase if total amount spent is < 20 EUR.
     * - User earns 1.00% of purchase if total amount spent is between 20 EUR and 50 EUR.
     * - User earns 1.50% of purchase if total amount spent is > 50 EUR.
     * @param _sender       Pharmacy account to send the tokens.
     * @param _recipient    User account to receive the tokens.
     * @param _amount       Amount of tokens to be transferred.
     */
    function earnTokensOnPurchase(address _sender, address _recipient, uint256 _amount) external isOwner {
        require(_amount > 0, "Amount must be greater than 0");

        uint256 result;
        if (_amount < (_dec.mul(20))) {
            result = _amount.mul(50).div(10000);
        } else if (_amount <= (_dec.mul(50))) {
            result = _amount.mul(100).div(10000);
        } else if (_amount > (_dec.mul(50))) {
            result = _amount.mul(150).div(10000);
        }

        _transfer(_sender, _recipient, result);
    }

    /**
     * @dev Buy tokens
     * Tokens are transferred from the contract owner to the recipient.
     * @param _recipient    User account to receive the tokens.
     * @param _amount       Amount to be transferred to the recipient.
     */
    function buyTokens(address _recipient, uint256 _amount) external isOwner {
        require(_amount > 0, "Amount must be greater than 0");
        approve(owner, _amount);
        transferFrom(owner, _recipient, _amount);
    }

    /**
     * @dev Spend tokens when a User purchases Products, i.e., pay Products using Tokens instead of Fiat
     * Tokens are transferred from the User wallet (sender) to the Pharmacy wallet (recipient)
     * @param _recipient    Pharmacy account to receive the tokens.
     * @param _amount       Amount of tokens to be transferred.
     */
     function spendTokensOnPurchase(address _recipient, uint256 _amount) external {
         require(_amount > 0, "Amount must be greater than 0");
         transfer(_recipient, _amount);
     }

    /**
     * @dev Earn tokens when a User shares personal data (anonymously) to a Laboratory
     * ...
     * @param xxx       xxxx
     * @param yyy       fdfdf
     */
    // function earnTokensFromLab()

}
