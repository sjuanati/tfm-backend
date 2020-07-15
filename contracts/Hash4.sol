pragma solidity 0.6.1;

contract Hash4 {

    event SaveHash(bytes32 indexed _orderID, bytes32 indexed _orderValue);

    address payable public owner;
    
    // Constructor to assign the Contract Creator as Owner
    constructor() public payable {
        owner = msg.sender;
    }

    // Modifier to check if caller is Owner
    modifier isOwner() {
        require(msg.sender == owner, "Caller is not the Owner");
        _;
    }

    /**
     * @dev Emit event to save Order data using SHA256 to be able to check integrity
     * of any status change on the Order afterwards
     * Returns a boolean value indicating whether the operation succeeded.
     * @param _orderID SHA256 of the Order ID
     * @param _orderValue SHA256 of a set of Order fields (Order ID, Order item, Product ID...)
     */
    function saveHash(bytes32 _orderID, bytes32 _orderValue) external isOwner returns (bool) {
        
        emit SaveHash(_orderID, _orderValue);

        return true;
    }
}
