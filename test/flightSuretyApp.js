const { assert } = require('chai');
const FlightSuretyData = artifacts.require("FlightSuretyData");
const truffleAssert = require('truffle-assertions');
const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const BigNum = require('bignumber.js');

async function createAirline(appContract, airline, name, voter) {
  const initialFundingAmount = web3.utils.toWei("10"); // 10 ether is converted to Wei

  await appContract.registerAirline(airline, name, { 
    from: voter 
  });
  await appContract.sendTransaction({ 
    from: airline, 
    value: initialFundingAmount 
  });
}

async function bootstrapContract(accounts) {
  const ownerAppContract = accounts[1];
  const ownerDataContract = accounts[0];

  const dataContract = await FlightSuretyData.new({
    from: ownerDataContract
  });

  // app contract is created and its address is stored
  const appContract = await FlightSuretyApp.new(dataContract.address, { 
    from: ownerAppContract 
  });

  // Caller contract address is set to the Data Contract
  await dataContract.setCallerContractAddress(appContract.address, { 
    from: accounts[0] 
  });
  await dataContract.setOperatingStatus(true, {
    from: ownerDataContract
  });

  await createAirline(appContract, ownerAppContract, 'Indigo', ownerAppContract);
  await createAirline(appContract, accounts[2], 'Air India', accounts[1]);
  await createAirline(appContract, accounts[3], 'SpiceJet', accounts[2]);
  await createAirline(appContract, accounts[4], 'Alliance Air', accounts[3]);

  return { appContract, dataContract };
}

contract("FlightSuretyApp", accounts => {
  describe('Airline Registration', () => {
    it("can register airlines and grant consent", async () => {
      const { appContract, dataContract } = await bootstrapContract(accounts);
      await Promise.all(
        [
          accounts[1],
          accounts[2],
          accounts[3],
          accounts[4],
        ].map(async airlineOwner => {
          const result = await dataContract.getAirline(airlineOwner);
          assert.equal(result.consensus, true, "Airline is not approved");
          assert.equal(result.activated, true, "Airline is not activated");
        })
      );

      await appContract.registerAirline(accounts[5], 'Vistara', { 
        from: accounts[4] 
      });

      let result = await dataContract.getAirline(accounts[5]);
      assert.equal(result.consensus, false, "Airline is already approved");

      await appContract.registerAirline(accounts[5], 'Vistara', { 
        from: accounts[1] 
      });

      result = await dataContract.getAirline(accounts[5]);
      assert.equal(result.voteCount, 2, "Unexpected value");

      // When total airlines reaches 4, voting is needed to achieve consensus to add the airline

      assert.equal(result.consensus, true, "Not enough votes");

      await appContract.registerAirline(accounts[6], 'AirAsia India', { 
        from: accounts[1] 
      });
      result = await dataContract.getAirline(accounts[6]);
      assert.equal(result.consensus, false, "Not enough votes");

      await appContract.registerAirline(accounts[6], 'AirAsia India', { 
        from: accounts[2] 
      });
      result = await dataContract.getAirline(accounts[6]);
      assert.equal(result.consensus, false, "Not enough votes");

      await appContract.registerAirline(accounts[6], 'AirAsia India', { 
        from: accounts[3] 
      });
      result = await dataContract.getAirline(accounts[6]);
      assert.equal(result.consensus, true, "Not enough votes");
    });
  });

  describe('Airlines Activation', () => {
    it("can validate transaction", async () => {
      const ownerAppContract = accounts[1];
      const ownerDataContract = accounts[0];

      const dataContract = await FlightSuretyData.new({
        from: ownerDataContract
      });
      const appContract = await FlightSuretyApp.new(dataContract.address, { 
        from: ownerAppContract 
      });
      await dataContract.setCallerContractAddress(appContract.address, { 
        from: accounts[0] 
      });
      await dataContract.setOperatingStatus(true, {
        from: ownerDataContract
      });

      await appContract.registerAirline(ownerAppContract, 'Indigo', { 
        from: ownerAppContract 
      });

      await truffleAssert.passes(
        appContract.sendTransaction({ 
          from: ownerAppContract, 
          value: web3.utils.toWei("10.1") 
        }),
        truffleAssert.ErrorType.REVERT // Error message
      );
    });
  });

  describe('Flight Registration', () => {
    it('can register flight', async () => {
      const ownerAppContract = accounts[1];
      const ownerDataContract = accounts[0];

      const flight = 'FL-0';
      const timestamp = Date.now();
      const airlineName = 'Indigo';

      const dataContract = await FlightSuretyData.new({
        from: ownerDataContract
      });
      const appContract = await FlightSuretyApp.new(dataContract.address, { 
        from: ownerAppContract 
      });
      await dataContract.setCallerContractAddress(appContract.address, { 
        from: accounts[0] 
      });
      await dataContract.setOperatingStatus(true, {
        from: ownerDataContract
      });

      await createAirline(appContract, ownerAppContract, airlineName, ownerAppContract);

      await appContract.registerFlight(flight, timestamp, { 
        from: ownerAppContract 
      });
      
      const results = await appContract.fetchFlight(ownerAppContract, flight, timestamp);

      assert.equal(results.timestamp, timestamp);
      assert.equal(results.statusCode, 0);
      assert.equal(results.airlineName, airlineName);
    });
  });

  describe('Passenger Buying Insurance', () => {
    it('can buy insurance', async () => {
      const ownerAppContract = accounts[1];
      const ownerDataContract = accounts[0];

      const flight = 'FL-0';
      const timestamp = Date.now();
      const airlineName = 'Indigo';
      
      const initialBalance = await web3.eth.getBalance(accounts[2]);
      const insuranceAmount = web3.utils.toWei("0.5");

      const dataContract = await FlightSuretyData.new({
        from: ownerDataContract
      });
      const appContract = await FlightSuretyApp.new(dataContract.address, { 
        from: ownerAppContract 
      });

      await dataContract.setCallerContractAddress(appContract.address, { 
        from: accounts[0] 
      });
      await dataContract.setOperatingStatus(true, {
        from: ownerDataContract
      });
      await createAirline(appContract, ownerAppContract, airlineName, ownerAppContract);
      await appContract.registerFlight(flight, timestamp, { 
        from: ownerAppContract 
      });
      await appContract.buyInsurance(
        ownerAppContract, 
        flight, 
        timestamp, { 
          from: accounts[2], 
          value: insuranceAmount 
        }
      );

      const newBalance = await web3.eth.getBalance(accounts[2]);
      const balanceExpected = (new BigNum(newBalance)).isLessThanOrEqualTo(BigNum(initialBalance - insuranceAmount));

      assert.equal(balanceExpected, true);
    });
  });
});
