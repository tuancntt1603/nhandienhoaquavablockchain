// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FruitAudit {
    address public owner;
    
    struct Inspection {
        string lotId;
        string fruitType;
        string confidence;
        address inspector;
        uint256 timestamp;
        string origin;
    }

    Inspection[] public inspections;
    mapping(string => uint256) public lotToIndex;
    mapping(string => bool) public lotExists;
    mapping(address => bool) public authorizedInspectors;

    event InspectionRecorded(string lotId, string fruitType, address inspector, uint256 timestamp);
    event InspectorAuthorized(address inspector);
    event InspectorRemoved(address inspector);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    modifier onlyInspector() {
        require(authorizedInspectors[msg.sender] || msg.sender == owner, "Not an authorized inspector");
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedInspectors[msg.sender] = true; // Chủ sở hữu mặc định là kiểm định viên
    }

    function authorizeInspector(address _inspector) public onlyOwner {
        authorizedInspectors[_inspector] = true;
        emit InspectorAuthorized(_inspector);
    }

    function removeInspector(address _inspector) public onlyOwner {
        authorizedInspectors[_inspector] = false;
        emit InspectorRemoved(_inspector);
    }

    function recordInspection(
        string memory _lotId,
        string memory _fruitType,
        string memory _confidence,
        string memory _origin
    ) public onlyInspector {
        require(!lotExists[_lotId], "Lot ID already exists");

        Inspection memory newInspection = Inspection({
            lotId: _lotId,
            fruitType: _fruitType,
            confidence: _confidence,
            inspector: msg.sender,
            timestamp: block.timestamp,
            origin: _origin
        });

        inspections.push(newInspection);
        lotToIndex[_lotId] = inspections.length - 1;
        lotExists[_lotId] = true;

        emit InspectionRecorded(_lotId, _fruitType, msg.sender, block.timestamp);
    }

    function getInspectionCount() public view returns (uint256) {
        return inspections.length;
    }

    function getInspection(uint256 _index) public view returns (
        string memory, string memory, string memory, address, uint256, string memory
    ) {
        require(_index < inspections.length, "Index out of bounds");
        Inspection memory ins = inspections[_index];
        return (ins.lotId, ins.fruitType, ins.confidence, ins.inspector, ins.timestamp, ins.origin);
    }

    function getInspectionByLot(string memory _lotId) public view returns (
        string memory, string memory, string memory, address, uint256, string memory
    ) {
        require(lotExists[_lotId], "Lot ID not found");
        return getInspection(lotToIndex[_lotId]);
    }
}
