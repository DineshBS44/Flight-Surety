pragma solidity ^0.8.6;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;
    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner; // Account used to deploy contract
    bool private operational = true; // Blocks all state changes throughout the contract if false
    address private callerContract; // The deployed App contract address which can call this Data Contract

    struct Insurance {
        uint256 amount;
        uint256 claimAmount;
        uint8 status;
    }

    struct Airline {
        uint8 id;
        string name;
        bool consensus;
        int8 voteCount;
        bool activated;
        uint256 balance;
    }

    uint8 private constant BOUGHT_INSURANCE = 0;
    uint8 private constant CLAIMED_INSURANCE = 1;
    uint8 private constant WITHDRAWN_INSURANCE = 2;

    mapping(bytes32 => Insurance) insurances; // key => Insurance
    uint8 totalCountAirlines; // number of airlines

    mapping(address => Airline) airlines; // airlineAddress => Airline
    mapping(address => mapping(address => bool)) votes; // voterAddress => airlineAddress

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/
    event ChangedcallerContract(
        address indexed oldAddress,
        address indexed newAddress
    );

    /********************************************************************************************/
    /*                                       Constructor                                        */
    /********************************************************************************************/

    /**
     * @dev Constructor
     *      The deploying account becomes contractOwner
     */
    constructor() {
        contractOwner = msg.sender;
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
     * @dev Modifier that requires the "operational" boolean variable to be "true"
     *      This is used on all state changing functions to pause the contract in
     *      the event there is an issue that needs to be fixed
     */
    modifier requireIsOperational() {
        require(operational, "Contract is currently not operational");
        _; // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
     * @dev Modifier that requires the "ContractOwner" account to be the function caller
     */
    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /**
     * @dev Modifier that requires the callerContract to be the function caller
     */
    modifier requireCallerContract() {
        require(
            msg.sender == callerContract,
            "Caller is not the FlightSuretyApp contract"
        );
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
     * @dev Get operating status of contract
     *
     * @return A bool that is the current operating status
     */
    function isOperational() external view returns (bool) {
        return operational;
    }

    /**
     * @dev Sets contract operations on/off
     *
     * When operational mode is disabled, all write transactions except for this one will fail
     */
    function setOperatingStatus(bool mode) external requireContractOwner {
        operational = mode;
    }

    /**
     * @dev Sets app contract address
     *
     * This allows contract owner to change app contract address, in case a new app is present
     */
    function setcallerContractAddress(address _callerContract) external requireContractOwner {
        callerContract = _callerContract;

        emit ChangedcallerContract(callerContract, _callerContract);
    }

    /**
     * @dev Get current app contract address
     *
     * This allows contract owner to fetch current app contract address
     */
    function getcallerContract() external view requireContractOwner returns (address) {
        return callerContract;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    /**
     * @dev Add an airline to the registration queue
     *      Can only be called from FlightSuretyApp contract
     *
     */
    function registerAirline(address _voterAddress, address addressAirline, string memory _airlineName, bool consensus) external requireIsOperational requireCallerContract {

        _vote(_voterAddress, addressAirline);
        totalCountAirlines += 1;
        // airlines count is incremented

        airlines[addressAirline] = Airline({id: totalCountAirlines, name: _airlineName, consensus: consensus, balance: 0, activated: false, voteCount: 1 });
    }

    /**
     * @dev Get details of the airline from its address
     */
    function getAirline(address addressAirline) external view
      returns (
          uint8 id,
          string memory name,
          bool consensus,
          int8 voteCount,
          bool activated,
          uint256 balance ) {

        id = airlines[addressAirline].id;
        name = airlines[addressAirline].name;
        consensus = airlines[addressAirline].consensus;
        voteCount = airlines[addressAirline].voteCount;
        activated = airlines[addressAirline].activated;
        balance = airlines[addressAirline].balance;
    }

    /**
     * @dev Fund the balance for airline
     */
    function addAirlineBalance(address addressAirline, uint256 amount) external requireIsOperational requireCallerContract {
        airlines[addressAirline].balance += amount;
    }

    /**
     * @dev Get airline id from its address
     */
    function getAirlineId(address addressAirline) external view returns (uint8 id) {
        id = airlines[addressAirline].id;
    }

    /**
     * @dev Approve an airline to be a part of this Flight insurance
     */
    function approveAirline(address addressAirline) external requireIsOperational requireCallerContract {
        airlines[addressAirline].consensus = true;
    }

    /**
     * @dev Get the total number of airlines registered
     */
    function getTotalCountAirlines() external view returns (uint8 count) {
        count = totalCountAirlines;
    }

    /**
     * @dev Vote for an airline
     */
    function voteAirline(address _voterAddress, address addressAirline) external requireIsOperational requireCallerContract returns (int8 voteCount) {
        
        _vote(_voterAddress, addressAirline);
        voteCount = airlines[addressAirline].voteCount;
    }

    /**
     * @dev An airline with the given address will be activated
     */
    function activateAirline(address addressAirline) external requireIsOperational requireCallerContract {
        airlines[addressAirline].activated = true;
    }

    /**
     * @dev Get the insurance details for the passenger and flight
     */
    function getInsurance(address _passengerAddr, bytes32 _flightKey) external view
      returns (
          uint256 amount,
          uint256 claimAmount,
          uint8 status ) {

        bytes32 key = getInsuranceKey(_passengerAddr, _flightKey);

        amount = insurances[key].amount;
        claimAmount = insurances[key].claimAmount;
        status = insurances[key].status;
    }

    /**
     * @dev Withdraws the insurance claimed
     */
    function withdrawInsurance(address _passengerAddr, bytes32 _flightKey) external requireIsOperational requireCallerContract {
        bytes32 key = getInsuranceKey(_passengerAddr, _flightKey);
        insurances[key].status = WITHDRAWN_INSURANCE;
    }

    /**
     * @dev To claim the insurance
     */
    function claimInsurance(address _passengerAddr, bytes32 _flightKey, uint256 claimAmount) external requireIsOperational requireCallerContract {

        bytes32 key = getInsuranceKey(_passengerAddr, _flightKey);
        insurances[key].status = CLAIMED_INSURANCE;
        insurances[key].claimAmount = claimAmount;
    }

    /**
     * @dev When a passenger buys an insurance, this function adds the insurance for the passenger
     * Called in the app contract when the passenger buys insurance for a particular flight
     */
    function addInsurance(address _passengerAddr, bytes32 _flightKey, uint256 amount) external requireIsOperational requireCallerContract {

        bytes32 key = getInsuranceKey(_passengerAddr, _flightKey);

        // Key is used to keep track of the insurances for a specific passenfer and flight in the insurance mapping

        insurances[key] = Insurance({
            amount: amount,
            claimAmount: 0,
            status: BOUGHT_INSURANCE
        });
    }

    /**
     * @dev Key is calculated to be unique for each flight by using hashing algorithm
     */
    function getInsuranceKey(address _passengerAddr, bytes32 _flightKey) private pure returns (bytes32) {
        return keccak256(abi.encodePacked(_passengerAddr, _flightKey));
    }

    /**
     * @dev Voter's vote is added to an airline
     */
    function _vote(address _voterAddress, address addressAirline) private {
        require(
            (totalCountAirlines == 0) || (_voterAddress != addressAirline),
            "Can't vote on your own except when the owner creates the contract"
        );
        // Allows the owner to vote himself when contract is created

        require(votes[_voterAddress][addressAirline] == false, "Voter has already voted for this airline");
        votes[_voterAddress][addressAirline] = true; // votes mapping is updated to record the voting
        airlines[addressAirline].voteCount += 1; // votecount for the airline increased by 1
    }
}
