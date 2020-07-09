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
     * @dev Save Order ID and Order Value through log
     * Emits a {SaveHash} event
     * Returns a boolean value indicating whether the operation succeeded.
     * @param _orderID Order ID hash (to be able to find the event by Order ID)
     * @param _orderValue Order Value hash (to check data integrity afterwards)
     */
    function saveHash(bytes32 _orderID, bytes32 _orderValue) external isOwner returns (bool) {
        
        emit SaveHash(_orderID, _orderValue);

        return true;
    }
}
