pragma solidity ^0.8.6;

import "./FlightSuretyData.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol"; // to typecase variable types safely
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */

/// @author Dinesh B S
contract FlightSuretyApp {
  using SafeMath for uint256; // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)
  /*******************************************************************/
  /*              DATA VARIABLES                                     */
  /*******************************************************************/

  // Flight status codes
  uint8 private constant STATUS_CODE_UNKNOWN = 0;
  uint8 private constant STATUS_CODE_ON_TIME = 10;
  uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
  uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
  uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
  uint8 private constant STATUS_CODE_LATE_OTHER = 50;

  address private contractOwner; // Account used to deploy contract
  FlightSuretyData private dataContract;

  struct Flight {
    bool isRegistered;
    uint8 statusCode;
    uint256 updatedTimestamp;
    address airline;
  }
  mapping(bytes32 => Flight) private flights;

  uint256 constant MINIMUM_FUNDING = 10 ether;
  uint8 constant MAXIMUM_OWNERS_TO_NOT_VOTE = 4;

  /*******************************************************************/
  /*                      FUNCTION MODIFIERS                         */
  /*******************************************************************/

  /**
   * @dev Modifier that requires the "operational" boolean variable to be "true"
   *      This is used on all state changing functions to pause the contract in
   *      the event there is an issue that needs to be fixed
   */
  modifier requireIsOperational() {
    require(isOperational(), "Contract is currently not operational");
    _; // All modifiers require an "_" which indicates where the function body will be added
  }

  /**
   * @dev Modifier that requires the "ContractOwner" account to be the function caller
   */
  modifier requireContractOwner() {
    require(msg.sender == contractOwner, "Caller is not contract owner");
    _; // All modifiers require an "_" which indicates where the function body will be added
  }

  /**
   * @dev Modifier that requires acitivated airlines to call the function
   */
  modifier requireActivatedAirline() {
    require(isActivatedAirline(msg.sender), "The Airline is not active");
    _; // All modifiers require an "_" which indicates where the function body will be added
  }

  /**
   * @dev Modifier that requires a register airline to call the function
   */
  modifier requireRegisteredAirline() {
    require(isRegisteredAirline(msg.sender), "Airline is not registered");
    _; // All modifiers require an "_" which indicates where the function body will be added
  }

  /**
   * @dev Modifier that requires the minimum funding requirement to satisfied
   */
  modifier requireMinimumFunding() {
    require(msg.value >= MINIMUM_FUNDING, "Airline initial funding isn't sufficient");
    _; // All modifiers require an "_" which indicates where the function body will be added
  }

  /**
   * @dev Modifier that requires an activated airline or the owner to call the function
   */
  modifier requireActivatedAirlineOrContractOwner() {
    require(isActivatedAirline(msg.sender) || (msg.sender == contractOwner), "Caller must be either the owner or an active airline");
    _; // All modifiers require an "_" which indicates where the function body will be added
  }

  /********************************************************************************************/
  /*                                       CONSTRUCTOR                                        */
  /********************************************************************************************/

  /**
   * @dev Contract constructor
   *
   */
  constructor(address payable addressDataContract) {
    contractOwner = msg.sender;
    dataContract = FlightSuretyData(addressDataContract);
  }

  /********************************************************************************************/
  /*                                       UTILITY FUNCTIONS                                  */
  /********************************************************************************************/

  function isOperational() public view returns (bool) {
    return dataContract.isOperational();
  }

  /**
   * @dev Determines whether an airline is registered
   */
  function isRegisteredAirline(address addressAirline) private view returns (bool registered) {
    (uint8 id, , , , , ) = dataContract.getAirline(addressAirline);
    registered = (id != 0);
  }

  /**
   * @dev Sets contract operations to pause or resume
   */
  function setOperatingStatus(bool newMode) external requireContractOwner {
    dataContract.setOperatingStatus(newMode);
  }

  /**
   * @dev Returns if an airline is active
   */
  function isActivatedAirline(address addressAirline) private view returns (bool activated) {
    (, , , , activated, ) = dataContract.getAirline(addressAirline);
  }

  /******************************************************************************/
  /*                       SMART CONTRACT FUNCTIONS                             */
  /******************************************************************************/

  /**
   * @dev Add an airline to the registration queue
   **/
  function registerAirline(address airlineAddress, string calldata airlineName) external requireIsOperational requireActivatedAirlineOrContractOwner {
    
    if (dataContract.getAirlineId(airlineAddress) != 0) {
      _voteAirline(airlineAddress); // vote
    } else {
      _registerNewAirline(airlineAddress, airlineName); // Request for new registration
    }
  }

  /**
   * @dev Register a future flight for insuring.
   *
   */
  function registerFlight(string calldata _flight, uint256 _newTimestamp) external requireActivatedAirline {
    
    bytes32 key = getFlightKey(msg.sender, _flight, _newTimestamp); // key for uniqueness
    flights[key] = Flight({
      isRegistered: true,
      statusCode: STATUS_CODE_UNKNOWN,
      updatedTimestamp: _newTimestamp,
      airline: msg.sender
    });
  }

  function getInsurance(address _airline, string calldata _flight, uint256 _timestamp) external view
    returns (
      uint256 amount,
      uint256 claimAmount,
      uint8 status ) {

    bytes32 key = getFlightKey(_airline, _flight, _timestamp); // key for uniqueness
    (amount, claimAmount, status) = dataContract.getInsurance(msg.sender, key);
  }

  function fetchFlight(address _airline, string calldata _flight, uint256 _timestamp) external view 
    returns (
      uint256 timestamp,
      uint8 statusCode,
      string memory airlineName ) {

    bytes32 key = getFlightKey(_airline, _flight, _timestamp);
    statusCode = flights[key].statusCode;
    timestamp = flights[key].updatedTimestamp;
    (, airlineName, , , , ) = dataContract.getAirline(_airline);
  }

  function buyInsurance(address _airline, string calldata _flight, uint256 _timestamp) external payable {
    
    require(msg.value > 0, "Cannot send 0 ether");
    bytes32 key = getFlightKey(_airline, _flight, _timestamp);
    if (msg.value <= 1 ether) {
      dataContract.addInsurance(msg.sender, key, msg.value);
      return;
    }

    // If the value sent is more than 1 ether, return the excess amount as 1 ether is the maximum insurance amount
    dataContract.addInsurance(msg.sender, key, 1 ether);

    address payable toSender = payable(msg.sender);
    uint excessAmount = msg.value - 1 ether;
    toSender.transfer(excessAmount);
  }

  function withDrawInsurance(address _airline, string calldata _flight, uint256 _timestamp) external {

    bytes32 key = getFlightKey(_airline, _flight, _timestamp);
    (, uint256 claimAmount, uint8 status) = dataContract.getInsurance(msg.sender, key);
    require(status == 1, "Insurance is not claimed");
    dataContract.withdrawInsurance(msg.sender, key);

    address payable toSender = payable(msg.sender);
    toSender.transfer(claimAmount);
  }

  function claimInsurance(address _airline, string calldata _flight, uint256 _timestamp) external {

    bytes32 key = getFlightKey(_airline, _flight, _timestamp); // key for uniqueness
    require(flights[key].statusCode == STATUS_CODE_LATE_AIRLINE, "Airline is not late due its own fault");

    (uint256 amount, , uint8 status) = dataContract.getInsurance(msg.sender, key);
    require(amount > 0, "Insurance is not bought");
    require(status == 0, "Insurance is already claimed");

    uint256 amountToClaim = amount.mul(150).div(100); // 1.5 times amount spent on insurance is retured when the flight is delayed
    dataContract.claimInsurance(msg.sender, key, amountToClaim);
  }

  /**
   * @dev Called after oracle has updated flight status
   */
  function processFlightStatus(address _airline, string memory _flight, uint256 _timestamp, uint8 statusCode) internal {

    bytes32 key = getFlightKey(_airline, _flight, _timestamp);
    flights[key].statusCode = statusCode;
  }

  // Generate a request for oracles to fetch flight information
  function fetchFlightStatus(
    address airline,
    string calldata flight,
    uint256 timestamp
  ) external {
    uint8 index = getRandomIndex(msg.sender);

    // Generate a unique key for storing the request
    bytes32 key = keccak256(
      abi.encodePacked(index, airline, flight, timestamp)
    );
    ResponseInfo storage responseInfo = oracleResponses[key]; // to resolve the issue caused by updated version in solidity
    responseInfo.requester = msg.sender;
    responseInfo.isOpen = true;

    emit OracleRequest(index, airline, flight, timestamp);
  }

  fallback() external payable {
    _receiveAirlineFunds();
  }

  receive() external payable {
    _receiveAirlineFunds();
  }

  function _receiveAirlineFunds()  /// '_' respresents a private function
    private requireRegisteredAirline requireMinimumFunding {
    
    dataContract.addAirlineBalance(msg.sender, msg.value);
    dataContract.activateAirline(msg.sender);
  }

  function _voteAirline(address addressAirline) private {  /// '_' respresents a private function
    
    uint256 airlineVoteCount = SafeCast.toUint256(
      dataContract.voteAirline(msg.sender, addressAirline)
    );

    uint256 totalAirlineCount = dataContract.getTotalCountAirlines() - 1;
    uint value = airlineVoteCount.mul(100).div(totalAirlineCount);

    if (value >= 50) {
      dataContract.approveAirline(addressAirline);
    }
  }

  function _registerNewAirline(address addressAirline, string memory nameAirline) private {  /// '_' respresents a private function
    
    dataContract.registerAirline(
      msg.sender,
      addressAirline,
      nameAirline,
      dataContract.getTotalCountAirlines() < MAXIMUM_OWNERS_TO_NOT_VOTE // consensus
    );
  }

  // ORACLE MANAGEMENT

  // Incremented to add pseudo-randomness at various points
  uint8 private nonce = 0;

  // Fee to be paid when registering oracle
  uint256 public constant REGISTRATION_FEE = 1 ether;

  // Number of oracles that must respond for valid status
  uint256 private constant MIN_RESPONSES = 3;

  struct Oracle {
    bool isRegistered;
    uint8[3] indexes;
  }

  // Track all registered oracles
  mapping(address => Oracle) private oracles;

  // Model for responses from oracles
  struct ResponseInfo {
    address requester; // Account that requested status
    bool isOpen; // If open, oracle responses are accepted
    mapping(uint8 => address[]) responses; // Mapping key is the status code reported
    // This lets us group responses and identify
    // the response that majority of the oracles
  }

  // Track all oracle responses
  // Key = hash(index, flight, timestamp)
  mapping(bytes32 => ResponseInfo) private oracleResponses;

  // Event fired each time an oracle submits a response
  event FlightStatusInfo(
    address airline,
    string flight,
    uint256 timestamp,
    uint8 status
  );

  event OracleReport(
    address airline,
    string flight,
    uint256 timestamp,
    uint8 status
  );

  // Event fired when flight status request is submitted
  // Oracles track this and if they have a matching index
  // they fetch data and submit a response
  event OracleRequest(
    uint8 index,
    address airline,
    string flight,
    uint256 timestamp
  );

  // Register an oracle with the contract
  function registerOracle() external payable {
    // Require registration fee
    require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

    uint8[3] memory indexes = generateIndexes(msg.sender);

    oracles[msg.sender] = Oracle({ isRegistered: true, indexes: indexes });
  }

  function getMyIndexes() external view returns (uint8[3] memory) {
    require(oracles[msg.sender].isRegistered, "Not registered as an oracle");

    return oracles[msg.sender].indexes;
  }

  // Called by oracle when a response is available to an outstanding request
  // For the response to be accepted, there must be a pending request that is open
  // and matches one of the three Indexes randomly assigned to the oracle at the
  // time of registration (i.e. uninvited oracles are not welcome)
  function submitOracleResponse(
    uint8 index,
    address airline,
    string calldata flight,
    uint256 timestamp,
    uint8 statusCode
  ) external {
    require(
      (oracles[msg.sender].indexes[0] == index) ||
        (oracles[msg.sender].indexes[1] == index) ||
        (oracles[msg.sender].indexes[2] == index),
      "Index does not match oracle request"
    );

    bytes32 key = keccak256(
      abi.encodePacked(index, airline, flight, timestamp)
    );
    require(
      oracleResponses[key].isOpen,
      "Flight or timestamp do not match oracle request"
    );

    oracleResponses[key].responses[statusCode].push(msg.sender);

    // Information isn't considered verified until at least MIN_RESPONSES
    // oracles respond with the *** same *** information
    emit OracleReport(airline, flight, timestamp, statusCode);
    if (oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES) {
      emit FlightStatusInfo(airline, flight, timestamp, statusCode);

      // Handle flight status as appropriate
      processFlightStatus(airline, flight, timestamp, statusCode);
    }
  }

  function getFlightKey(
    address airline,
    string memory flight,
    uint256 timestamp
  ) internal pure returns (bytes32) {
    return keccak256(abi.encodePacked(airline, flight, timestamp));
  }

  // Returns array of three non-duplicating integers from 0-9
  function generateIndexes(address account) internal returns (uint8[3] memory) {
    uint8[3] memory indexes;
    indexes[0] = getRandomIndex(account);

    indexes[1] = indexes[0];
    while (indexes[1] == indexes[0]) {
      indexes[1] = getRandomIndex(account);
    }

    indexes[2] = indexes[1];
    while ((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
      indexes[2] = getRandomIndex(account);
    }

    return indexes;
  }

  // Returns array of three non-duplicating integers from 0-9
  function getRandomIndex(address account) internal returns (uint8) {
    uint8 maxValue = 10;

    // Pseudo random number...the incrementing nonce adds variation
    uint8 random = uint8(
      uint256(
        keccak256(abi.encodePacked(blockhash(block.number - nonce++), account))
      ) % maxValue
    );

    if (nonce > 250) {
      nonce = 0; // Can only fetch blockhashes for last 256 blocks so we adapt
    }

    return random;
  }

  // endregion
}
