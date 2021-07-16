
var Test = require('../config/testConfig.js');
//var BigNumber = require('bignumber.js');

contract('Oracles', async (accounts) => {

  const TEST_ORACLES_COUNT = 10; // 10 Oracles are used here to speed up the testing process
  var config;

  // Watch contract events
  const STATUS_CODE_UNKNOWN = 0;
  const STATUS_CODE_ON_TIME = 10;
  const STATUS_CODE_LATE_AIRLINE = 20;
  const STATUS_CODE_LATE_WEATHER = 30;
  const STATUS_CODE_LATE_TECHNICAL = 40;
  const STATUS_CODE_LATE_OTHER = 50;

  // code above is run for every single time "truffle test" command is used
  it('can register oracles', async () => {
    config = await Test.Config(accounts);

    // ARRANGE
    let fee = await config.flightSuretyApp.REGISTRATION_FEE.call();

    // ACT
    for(let a = 1; a < TEST_ORACLES_COUNT; a++) {      
      await config.flightSuretyApp.registerOracle({ 
        from: accounts[a], 
        value: fee 
      });
      let result = await config.flightSuretyApp.getMyIndexes({
        from: accounts[a]
      });
      console.log(`Oracle Registered: ${result[0]}, ${result[1]}, ${result[2]}`);
    }
  });
});
