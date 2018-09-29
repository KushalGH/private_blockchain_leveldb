/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const {
  addLevelDBData,
  getLevelDBData,
  getCompleteBlocksDBData,
  addDataToLevelDB
} = require('./levelSandbox.js');

const SHA256 = require('crypto-js/sha256');


/* ===== Block Class ==============================
|  Class with a constructor for block          |
|  ===============================================*/

class Block {
  constructor(data){
   this.hash = "",
   this.height = 0,
   this.body = data,
   this.time = 0,
   this.previousBlockHash = ""
 }
}

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain    |
|  ================================================*/

class Blockchain{


  constructor() {
    var self = this;
    this.getBlockHeight()
    .then(function(data) {
      if(data.length == 0) {            
        self.addBlock(new Block("First block in the chain - Genesis block"))
        .then(function() {

        })
        .catch(function(err) {
          console.log(err);
        })
      }
    })
  }

  

  // Add new block
  addBlock(newBlock){


    return new Promise(function(resolve, reject) {
      console.log(newBlock);
      if(typeof newBlock === 'object') { 
        getCompleteBlocksDBData().then(function(data) {
          console.log(data);
            // Block height
            if(typeof newBlock === 'object') {
              newBlock.height = data.length;
            // UTC timestamp
            newBlock.time = new Date().getTime().toString().slice(0,-3);
            // previous block hash
            if(data.length > 0){
              newBlock.previousBlockHash = data[data.length-1].hash;
            }
            // Block hash with SHA256 using newBlock and converting to a string
            newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
            console.log("ks", JSON.stringify(newBlock));
            // Adding block object to chain
            addDataToLevelDB(newBlock)
            .then(function(result)  {
              resolve(result);
            });              
          }
          else {
            reject();
          }        
        })
      }
      else {
        var error = "Please enter a Block try new Block(<<message>>)";
        console.log(error)
        reject(error);
      }

    });


  }

  // Get block height
  getBlockHeight(){
    return getCompleteBlocksDBData().then(function(data) {
      console.log(data);
      return data;
    })
      //return this.chain.length-1;
    }

    // get block
    getBlock(blockHeight){
      return getLevelDBData(blockHeight).then(function(data) {
        return JSON.parse(JSON.stringify(data));
      })
      // return object as a single string
      //return JSON.parse(JSON.stringify(this.chain[blockHeight]));
    }

    // validate block
    validateBlock(blockHeight){

      return new Promise(function(resolve, reject) {
        getCompleteBlocksDBData().then(function(data) {
            // get block object
            let block = data[blockHeight]; 
            // get block hash
            let blockHash = block.hash;
            // remove block hash to test block integrity
            block.hash = '';
            // generate block hash
            let validBlockHash = SHA256(JSON.stringify(block)).toString();
            // Compare
            if (blockHash===validBlockHash) {
             return true;
           } else {
            console.log('Block #'+blockHeight+' invalid hash:\n'+blockHash+'<>'+validBlockHash);
            return false;
          }
        })
      })
    }


    validateBlockConnection(height) {
      return new Promise(function(resolve, reject) {
        this.validateBlock(height).then(function(result) {
          if(!result) {
            console.log("validateBlockConnection no valid");
            resolve(1);
          }
          else {
            this.getBlock(height).then(function(data) {
              let blockHash = data.hash;
              this.getBlock(height + 1).then(function(nextdata) {
                let previousHash = nextdata.previousBlockHash;
                if(blockHash != previousHash) {
                  console.log("validateBlockConnection no valid");
                  resolve(1);
                }
                else {
                  console.log("validateBlockConnection valid");
                  resolve(0);
                }
              })
            })
          }
        })
      })
    }

   // Validate blockchain
   validateChain(){

    return(new Promise(function(resolve, reject) {
      getCompleteBlocksDBData().then(function(data) {
        let errorLog = [];
        var promiseArray = [];
        for (var i = 0; i < data.length-1; i++) {
              // validate block
              promiseArray.push(this.validateBlockConnection(i))
            }

            Promise.all(promiseArray).then(function(data) {
              if (data.length>0) {
                console.log('Block errors = ' + errorLog.length);
                console.log('Blocks: '+errorLog);
              } else {
                console.log('No errors detected');
              }
            })
          })
    }));
  }
}

/*
(function theLoop (i) {
      let myBlockChain = new Blockchain();
    setTimeout(function () {

        let blockTest = new Block("Test Block - " + (i + 1));
        myBlockChain.addBlock(blockTest).then((result) => {
            console.log(result);
            i++;
            if (i < 10) theLoop(i);
        });
    }, 10000);
  })(0);
  */