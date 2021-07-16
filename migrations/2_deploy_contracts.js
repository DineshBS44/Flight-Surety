const fs = require('fs');
const FlightSuretyData = artifacts.require("FlightSuretyData");
const FlightSuretyApp = artifacts.require("FlightSuretyApp");

const airlineNames = ['DApp Airlines', 'Air India', 'SpiceJet', 'GoAir', 'Vistara', 'TruJet'];
// The names of different airlines that are going to interact with our smart contract

module.exports = async function(deployer, _, accs) {

  await deployer.deploy(FlightSuretyData, { 
    from: accs[0] 
  });
  await deployer.deploy(FlightSuretyApp, FlightSuretyData.address, { 
    from: accs[0] 
  });

  const initialFundingAmount = web3.utils.toWei("10"); // 10 ether is converted to wei

  const dataContract = await FlightSuretyData.deployed();
  const appContract = await FlightSuretyApp.deployed();

  await dataContract.setCallerContractAddress(FlightSuretyApp.address, { 
    from: accs[0] 
  });
  await dataContract.setOperatingStatus(true, { 
    from: accs[0] 
  });

  // First airline is being registered
  await appContract.registerAirline(accs[0], airlineNames[0], { 
    from: accs[0] 
  });

  await appContract.sendTransaction({ 
    from: accs[0], 
    value: initialFundingAmount 
  });

  // All the 6 airlines are being registered

  await appContract.registerAirline(accs[1], airlineNames[1], { 
    from: accs[0] 
  });
  await appContract.sendTransaction({ 
    from: accs[1], 
    value: initialFundingAmount 
  });

  await appContract.registerAirline(accs[2], airlineNames[2], { 
    from: accs[1] 
  });
  await appContract.sendTransaction({ 
    from: accs[2], 
    value: initialFundingAmount 
  });

  await appContract.registerAirline(accs[3], airlineNames[3], { 
    from: accs[2] 
  });
  await appContract.sendTransaction({ 
    from: accs[3], 
    value: initialFundingAmount 
  });

  await appContract.registerAirline(accs[4], airlineNames[4], { 
    from: accs[1] 
  });
  await appContract.registerAirline(accs[4], airlineNames[4], { 
    from: accs[2] 
  });
  await appContract.sendTransaction({ 
    from: accs[4], 
    value: initialFundingAmount 
  });
  await appContract.registerAirline(accs[5], airlineNames[5], { 
    from: accs[1] 
  });
  await appContract.registerAirline(accs[5], airlineNames[5], { 
    from: accs[2] 
  });
  await appContract.registerAirline(accs[5], airlineNames[5], { 
    from: accs[3] 
  });

  await appContract.sendTransaction({ 
    from: accs[5], 
    value: initialFundingAmount 
  });

  // Registering Flights
  let flights = [];
  for(let i = 0; i < 5; i++) {
    const name = `FL-${i}`;
    const timestamp = getRandomHourTimestamps();

    flights.push({
      name, 
      timestamp, 
      airlineName: airlineNames[i], 
      airline: accs[i+1]
    });
    await appContract.registerFlight(name, timestamp, { 
      from: accs[i+1] 
    });
  }

  let config = {
    localhost: {
        url: 'http://localhost:7545',
        dataAddress: FlightSuretyData.address,
        appAddress: FlightSuretyApp.address,
        flights: flights
    }
  };

  fs.writeFileSync(__dirname + '/../src/dapp/config.json', JSON.stringify(config, null, '\t'), 'utf-8');

  // Registering Oracles
  config.localhost.oracles = {};

  await Promise.all(
    accs.map(async account => {
      await appContract.registerOracle({ 
        from: account, 
        value: web3.utils.toWei("1") 
      });

      config.localhost.oracles[account] = (await appContract.getMyIndexes({ 
        from: account 
      })).map(index => {
        return parseInt(index);
      });
    })
  );
  
  fs.writeFileSync(__dirname + '/../src/server/config.json', JSON.stringify(config, null, '\t'), 'utf-8');
}

function getRandomHourTimestamps() {
  const currentTimestamp = parseInt(+new Date() / 1000);
  const max = 10; // 10 hours from now
  const min = 1; // 1 hour from now
  const rand = parseInt(Math.random() * (max - min) + min);

  return(currentTimestamp + (rand * 3600));
}
