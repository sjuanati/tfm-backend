pragma solidity 0.6.1;

contract Hash2 {

    event SaveHash(address indexed _from, bytes32 indexed _orderID, bytes32 _orderValue);
    
    struct Doc {
        address sender;
        uint date;
        bytes32 hash;
    }

    mapping(bytes32 => Doc) record;
    address payable public owner;
    
    /**
     * @dev Constructor to assign the contract creator as owner
     */
    constructor() public payable {
        owner = msg.sender;
    }
    
    /**
     * @dev Stores the sender address, time and Order hash value in the storage
     * Returns a boolean value indicating whether the operation succeeded.
     * Emits a {SaveHash} event
     * @param _orderID Order ID hash (to be able to find the event by Order ID)
     * @param _orderValue Order Value hash (to check data integrity afterwards)
     */
    function saveHash(bytes32 _orderID, bytes32 _orderValue) external returns (bool) {

        record[_orderValue].sender = msg.sender;
        record[_orderValue].date = now;
        record[_orderValue].hash = _orderValue;

        emit SaveHash(msg.sender, _orderID, _orderValue);

        return true;
    }
    
    /**
     * @dev Getter for the Order hash value
     * @param _orderValue Order value hash
     */
    function getHash(bytes32 _orderValue) public view returns (address, uint, bytes32) {
        return (
            record[_orderValue].sender,
            record[_orderValue].date,
            record[_orderValue].hash
        );
    }

    function saveHash(bytes32 _orderID, bytes32 _orderValue) external returns (bool) {
        
        emit SaveHash(msg.sender, _orderID, _orderValue);

        return true;
    }
}