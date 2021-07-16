# Flight Surety

An Ethereum DApp (Decentralied application) that allows Flight passengers to insure flight delays which is implemented by Smart contracts using Solidity. It serves as an Insurance management system with no third party. Users can interact with the Contracts using the frontend. New Airlines are included using a voting based system which requires atleast 50% of the registered airlines to vote.

## FlightSurety contracts

The Data and Application are separated into different smart contracts 

FlightSuretyData is used to store the data related to Airlines, Flights, Votes, passengers, insurance details, etc

FlightSuretyApp has the core functionality related to Insurance management system
## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

Please make sure you've already installed ganache-cli, Truffle and enabled MetaMask extension in your browser.

### Installing

A step by step series of examples that tell you have to get a development environment running

#### Clone this repository:

```
git clone https://github.com/DineshBS44/Flight-Surety
```

Install all requisite npm packages (as listed in `package.json`):

```
npm install
```

#### Launch Ganache:

```
ganache-cli -m "<Seed Phrase>"
```

or

```
truffle develop
```

#### In a separate terminal window, Compile smart contracts:

```
truffle compile
```

This will create the smart contract artifacts in folder `build\contracts`.

#### Test smart contracts:

```
truffle test
```

#### Migrate smart contracts to the locally running blockchain, ganache-cli:

```
truffle migrate
```

#### In a separate terminal window, launch the DApp:

```
npm run dapp
```

## Built With

- [Ethereum](https://www.ethereum.org/) - Ethereum is a decentralized platform that runs smart contracts
- [IPFS](https://ipfs.io/) - IPFS is the Distributed Web | A peer-to-peer hypermedia protocol
  to make the web faster, safer, and more open.
- [Truffle Framework](http://truffleframework.com/) - Truffle is the most popular development framework for Ethereum with a mission to make your life a whole lot easier.

## Libraries/services used

- **ganache-cli** - For running a local blockchain mostly used for testing purposes
- **@openzeppelin-solidity** - To use the SafeMath and SafeCast functions
- **@truffle/hdwallet-provider** - Used to create a provider using Seed phrase(Mnemonic) and RPC URL to connect to the Blockchain Network
- **web3** - To interact with the deployed smart contract either on Ganache or Rinkeby test network
- **mocha & chai** - To test the smart contracts written in solidity
- **webpack-dev-server** - To host the DApp on the server
- **lodash** - Utility library for Javascript to make working with arrays, numbers, etc, easier
- **Remix** - To compile, deploy and test smart contracts on the Javascript VM
- **Metamask** - Ethereum wallet which is connected to the DApp
- **IPFS** - To make the DApp completely decentralized, the DApp and all its files are hosted to IPFS
- **Truffle** - Framework used to write, compile, test and deploy smart contracts with ease along with the frontend of the DApp.

## Commands in IPFS to host the project to IPFS

Make sure IPFS-cli is installed

##### Add all the files to IPFS using the command

`ipfs add -r FlightSurety`

##### To publish the DApp to incorporate changes to be viewed using the same hash, the commands used are

`ipfs daemon`

In an different terminal window, execute the following command to publish

`ipfs name publish <IPFS_HASH>`

### Some versions of Frameworks and Libraries used in this project are

- **Truffle version** - 5.3.14
- **Solidity version** - 0.8.6
- **Node JS version** - 14.16.1
- **truffle-hdwallet-provider version** - 1.0.17
- **web3 version** - 1.4.0

## Developer

- **Dinesh B S** [(@DineshBS44)](https://github.com/DineshBS44)

## License

Licensed under MIT License : https://opensource.org/licenses/MIT

<br>
<br>
