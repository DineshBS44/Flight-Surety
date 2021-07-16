const FlightSuretyData = artifacts.require("FlightSuretyData");
const FlightSuretyApp = artifacts.require("FlightSuretyApp");

contract("FlightSuretyData", accounts => {
  describe("Setting App Contract Address", async () => {
    it("can set new app contract address", async () => {

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

      assert.equal(await dataContract.getCallerContract(), appContract.address);
    });
  });

  // Describe block is used to group all the 'it' blocks together
  describe("Set Operating Status of the contract", async () => {
    it("can set operation status", async () => {

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

      assert.equal(await dataContract.isOperational(), true);
    });

    it("can disable operation status of data contract", async () => {

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

      // Operating status is set to false
      await dataContract.setOperatingStatus(false, {
        from: ownerDataContract
      });

      //checking if the mode of the contract is paused
      assert.equal(await dataContract.isOperational(), false);
    });
  });
});