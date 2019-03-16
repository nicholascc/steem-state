# steem-state
### Build decentralized apps on the Steem blockchain with ease!

## Installation
`npm install steem-state@1.3.2`
and to use the companion project, `steem-transact`,
`npm install steem-transact`

## Explanation

The Steem blockchain is one of the fastest and most performant blockchains in existence and also has over 60,000 active users each day, with free and fast transactions. `steem-state`, along with its companion project, `steem-transact` makes it incredibly easy to create decentralized apps on the Steem blockchain using soft consensus.

#### What is soft-consensus?

Most, if not all, blockchains focused on the creation of DApps today such as Ethereum are based around the idea of smart contracts. DApps running using smart contracts have their transactions verified by each node in the network. But this method is not the only way; not every node in the network has to verify every transaction for each DApp even if it doesn’t apply to them. When a transaction is not verified by every node in the network, but only the ones who use the DApp that the transaction applies to verify that transaction, soft-consensus occurs.

To use an analogy, the most adopted internet data transfer protocols (such as UDP) don’t try to do anything special with the data that is being sent. These protocols let the two users who are communicating verify, authenticate, etc their own data. Not everyone on the internet authenticates and verifies every data packet; it’s just not feasible.

Similarly, not everyone on a blockchain has to verify and authenticate every data packet. Ethereum is trying to introduce unneeded complexity to the problem of creating DApps by requiring that every user has to verify every transaction in every DApp, and it’s already hitting a scalabililty barrier partly because of it.

Anything that a smart contract can do can be done with soft-consensus, and soft-consensus can actually do much more. A soft consensus DApp is easy to hard fork without forking the main chain it runs on, and it has easy support for virtual operations (when a DApp creates a transaction that will execute after a certain amount of time), which Ethereum and most smart contract blockchains do not have, and will be implemented into the steem-state package in v2.0.0.

`steem-state` uses the `custom_json` operation type to create soft-consensus transactions. You can read more at the [dev portal](https://developers.steem.io) by searching up `custom_json`.

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

`mode`: whether to stream blocks as `latest` or `irreversible`. Irreversible is slower but much more secure, while `latest` is faster but can be vulnerable. We will use latest because our messaging app doesn't have to be highly secure, but for most DApps irreversible will be better (irreversible would be similar to waiting for 6 blocks in Bitcoin before confirming a transaction).

And we will create it like so, using the result from retreiving the latest block's number:
```
  var processor = steemState(client, steem, result.head_block_number, 100, 'basic_messaging_app_', 'latest');
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

If you run your code using `node index.js` you should get a terminal wher you can enter in text. Simply type in a message, press enter, and in a few moments your message will show up. Try running multiple instances at the same time to see that it is actually running on a blockchain. You can also look from steemd.com/@your_username_here (a Steem block explorer) to see your recent transactions. You should see a few transactions titled `custom_json` which have the json data of the transactions you created while testing the messaging app.

## Next 

Before you start developing your own app, learn how to create a token using `steem-state` and learn about design patterns to use when using `steem-state`, read more about building decentralized apps using soft consensus, and read the documentation on the [wiki](https://github.com/nicholas-2/steem-state/wiki).

*If you have any questions, suggestions, problems, or want advice about incorporating soft-consensus into your project, email me at nicholas2591@gmail.com.*
