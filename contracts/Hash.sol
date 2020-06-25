pragma solidity 0.6.1;

contract Hash {
    
    // Data structure
    struct Doc {
        address sender;
        uint date;
        bytes32 hash;
    }
    
    mapping(bytes32 => Doc) record;
    address payable public owner;
    
    // Constructor
    constructor() public payable {
        owner = msg.sender;
    }
    
    // Store Order hash
    function saveHash(bytes32 _hash) external returns (bool) {
        record[_hash].sender = msg.sender;
        record[_hash].date = now;
        record[_hash].hash = _hash;
        
        return true;
    }
    
    // Retrieve Order hash
    function getHash(bytes32 _hash) public view returns (address, uint, bytes32) {
        return (
            record[_hash].sender,
            record[_hash].date,
            record[_hash].hash
        );
    }
    
}