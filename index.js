/*
  args:
    client: A dsteem client to use to get blocks, etc. [REQUIRED]
    steem: A dsteem instance. [REQIURED]
    currentBlockNumber: The last block that has been processed by this client; should be
      loaded from some sort of storage file. Default is block 1.
    blockComputeSpeed: The amount of milliseconds to wait before processing
      another block (not used when streaming)
    prefix: The prefix to use for each transaction id, to identify the DApp which
      is using these transactions (interfering transaction with other Dappsids could cause
      errors)
*/
module.exports = function(client, steem, currentBlockNumber=1, blockComputeSpeed=1000, prefix='') {
  var onOperation = {};  // Stores the function to be run for each operation id.

  var onNewBlock = function() {};

  var isStreaming;

  var stream;

  var stopping = false;
  var stopCallback;


  // Returns the block number of the last block on the chain.
  function getHeadBlockNumber(callback) {
    client.database.getDynamicGlobalProperties().then(function(result) {
      callback(result.head_block_number)
    })
  }

  function isAtRealTime(callback) {
    getHeadBlockNumber(function(result) {
      if(currentBlockNumber >= result) {
        callback(true);
      } else {
        callback(false);
      }
    })
  }

  function beginBlockComputing() {
    function computeBlock() {

      var blockNum = currentBlockNumber;// Helper variable to prevent race condition
                                        // in getBlock()
      client.database.getBlock(blockNum)
        .then((result) => {
          processBlock(result, blockNum);
        })
        .catch((err) => {
          console.log("Error getting block:", err);
        })

      currentBlockNumber++;
      if(!stopping) {
        isAtRealTime(function(result) {
          if(!result) {
            setTimeout(computeBlock, blockComputeSpeed);
          } else {
            beginBlockStreaming();
          }
        })
      } else {
        setTimeout(stopCallback,1000);
      }
    }

    computeBlock();
  }

  function beginBlockStreaming() {
    isStreaming = true;
    stream = client.blockchain.getBlockStream({mode: steem.BlockchainMode.Latest});
    stream.on('data', function(block) {
      var blockNum = parseInt(block.block_id.slice(0,8), 16);
      if(blockNum >= currentBlockNumber) {
        processBlock(block, blockNum);
        currentBlockNumber = blockNum+1;
      }
    })
    stream.on('end', function() {
      console.error("Block stream ended unexpectedly.")
    })
  }

  function processBlock(block, num) {
    onNewBlock(num, block);
    var transactions = block.transactions;

    for(var i = 0; i < transactions.length; i++) {
      for(var j = 0; j < transactions[i].operations.length; j++) {

        var op = transactions[i].operations[j];
        if(op[0] === 'custom_json') {
          if(typeof onOperation[op[1].id] === 'function') {
            onOperation[op[1].id](JSON.parse(op[1].json), op[1].required_posting_auths[0]);
          }
        }
      }
    }
  }

  return {
    /*
      Determines a state update to be called when a new operation of the id
        operationId (with added prefix) is computed.
    */
    on: function(operationId, callback) {
      onOperation[prefix + operationId] = callback;
    },

    /*
      Determines a state update to be called when a new block is computed.
    */
    onBlock: function(callback) {
      onNewBlock = callback;
    },

    start: function() {
      beginBlockComputing();
      isStreaming = false;
    },

    getCurrentBlockNumber: function() {
      return currentBlockNumber;
    },

    isStreaming: function() {
      return isStreaming;
    },

    stop: function(callback) {
      if(isStreaming){
        stopping = true;
        stream.pause();
        setTimeout(callback,1000);
      } else {
        stopping = true;
        stopCallback = callback;
      }
    }
  }
}
