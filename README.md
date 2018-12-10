# steem-state
### Build decentralized apps on the Steem blockchain with ease!

## Installation
`npm install steem-state`
and to use the companion project, `steem-transact`,
`npm install steem-transact`

## Explanation

The Steem blockchain is one of the fastest and most performant blockchains in existence and also has over 60,000 active users each day, with free and fast transactions. `steem-state`, along with its companion project, `steem-transact` makes it incredibly easy to create decentralized apps on the Steem blockchain using soft consensus.

#### What is soft-consensus?
Most blockchain developers are used to creating decentralized apps on blockchains like Ethereum using smart-contracts. But smart contracts are not actually required to build decentralized apps. In fact, one can create much faster and cheaper apps using soft-consensus, and have the same amount of potential, ability, and decentralization as smart contracts do.

Soft consensus is where instead of every single client on a blockchain verifying a transaction such as a smart contract, only nodes who wish to use that DApp have to verify those transactions. In Steem, there is a type of transaction called a `custom_json` transaction that allows developers to create custom transactions containing json data. Then, every user who uses the DApp that the `custom_json` transaction is for will use that transaction to update their internal state. This allows every user using that DApp will have a consensus on what the current state is (state is like storage variables in Solidity smart contracts) without  actually verifying transactions on-chain. You can build everything from a messaging app to a full token to a decentralized game using soft consensus. If you have any questions email me at nicholas2591@gmail.com.

#### steem-state
`steem-state` is a framework for building fully decentralized DApps using soft-consensus with the Steem blockchain. Using `steem-state` you can define events that occur when a new transaction of a certain type is created, such as updating the state, displaying feedback for the user, etc. Using these events, you can build a fully decentralized DApp. Look below for an example tutorial.

## Example
The following example will create a decentralized messaging app on the Steem blockchain with a CLI using only 28 lines of code! With your final result you will be able to send messages to a public chatroom through the Steem blockchain. First, install the dependencies we'll need and set up the project:

```
mkdir basic-messaging-app
cd basic-messaging-app
npm init
npm install steem-state steem-transact dsteem
```

Then create index.js and we can start building! First we'll import our dependencies:
```
var steem = require('dsteem'); // This is our interface to the Steem blockchain.
var steemState = require('steem-state'); // This will allow us to build our DApp.
var steemTransact = require('steem-transact'); // This makes it easy to make transactions on the Steem blockchain.
var readline = require('readline'); // For the CLI (command line interface).
```
Next is some setup for `readline`, which we will use to create our basic CLI:
```
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})
```
Then we will create some variables for our username and private key on the Steem blockchain (instead of public keys like Bitcoin and Ethereum, Steem uses usernames). We'll hardcode this for the sake of simplicity, but you could easily ask the user to input theirs. To complete this step you will have to have a Steem account (which can be done at https://steemit.com).
```
const username = 'ned'; // Put your username here (without the @ sign).
const key = 'your-private-posting-key-here'; // Put your private posting key here.
```
Now we need to actually create our interface with the Steem blockchain. Like others like `web3` (for Ethereum), Steem uses the `dsteem` package to interface with the Steem blockchain. We'll provide this with a node to connect to (similar to how Infura works on Ethereum) and to get the blockchain data from:

```
var client = new steem.Client('https://api.steemit.com'); // One good node to use. You can find a good list at https://developers.steem.io/quickstart/#quickstart-steemd-nodes
```
Then we'll get the latest block to use as where we'll start processing blocks and transactions from:

```
client.database.getDynamicGlobalProperties().then(function(result) {
```
Then actually create the steem-state instance. This method uses the arguments:
`client`: the dsteem client to get transactions from,
`steem`: a dsteem instance,
`startingBlock`: which block to start at when processing blocks and transactions,
`processSpeed`: the amount of milliseconds to wait before getting the next block (when not fully caught up to the latest block),
`prefix`: the name of your DApp. This prefix is at the beginning of every transaction created for your DApp and ensures that no other DApps will use the same transaction ids as yours. Make sure to make this unique for your DApp! For example, [Steem Monsters](https://steemmonsters.com/), a highly successful Steem DApp, has the prefix `sm_`. We will use the prefix `basic_messaging_app_` for our app.

And we will create it like so, using the result from retreiving the latest block's number:
```
  var processor = steemState(client, steem, result.head_block_number, 100, 'basic_messaging_app_');
```

Next we will define what will happen when someone creates a `message` transaction, which will result in a display of that message to the user. After that, we will start the processor:
```
processor.on('message', function(json, from) {
  console.log(from, 'says:', json.message);
});
processor.start();
});              // Close the function we started before.
```
Finally we handle user input and when our DApp actually creates these `message` transactions. We'll first initialize our transactor by using the `steem-transact` package:

```
var transactor = steemTransact(client, steem, 'basic_messaging_app_');
```
Then we state that when the user creates a new line, intending to send a message, they will create a `message` transaction:
```
rl.on('line', function(input) {
  transactor.json(username, key, 'message', {
    message: input
  }, function(err, result) {
    if(err) {
      console.error(err);
    }
  });
});
```

The `json` function (used for creating a customJSON transaction) has 5 arguments:
`username`: username of the user to send a transaction from,
`key`: the private key of the above user, used to sign the transaction,
`id`: the id of the transaction to create,
`json`: the json of the transaction to create; in this case we create a small object which contains the message,
`callback`: the function to call once the transaction is created (or an error occurs).

Here is the full code:
```
var steem = require('dsteem');
var steemState = require('steem-state');
var steemTransact = require('steem-transact');
var readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var username = 'your_username_goes_here';
var key = 'your_private_posting_key_goes_here';



var client = new steem.Client('https://api.steemit.com');
client.database.getDynamicGlobalProperties().then(function(result) {
  var processor = steemState(client, steem, result.head_block_number, 100, 'basic_messaging_app_');
  processor.on('message', function(json, from) {
    console.log(from, 'says:', json.message);
  });
  processor.start();
});

var transactor = steemTransact(client, steem, 'basic_messaging_app_');
rl.on('line', function(input) {
  transactor.json(username, key, 'message', {
    message: input
  }, function(err, result) {
    if(err) {
      console.error(err);
    }
  });
});
```

If you run your code using `node index.js` you should get a terminal wher you can enter in text. Simply type in a message, press enter, and in a few moments your message will show up. Try running multiple instances at the same time to see that it is actually running on a blockchain. 
## Next

Learn how to create a token using `steem-state`, read more about building decentralized apps using soft consensus, and read the documentation on the [wiki](https://github.com/nicholas-2/steem-state/wiki).

*If you have any questions, suggestions, problems, or want advice about incorporating soft-consensus into your project, email me at nicholas2591@gmail.com.*
