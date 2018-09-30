/* ===== Persist data with LevelDB ===================================
|  Learn more: level: https://github.com/Level/level     |
|  =============================================================*/

const level = require('level');
const chainDB = './chaindata';
const db = level(chainDB);

// Add data to levelDB with key/value pair
function addLevelDBData(key,value) {  
  return new Promise(function(resolve, reject) {
    db.put(key, value, function(err) {
      if (err) {
        err = "error occured while creating the addLevelDBData", err;        
        return reject(err)
      } else {
        console.log("addLevelDBData success:", JSON.stringify(value));
         return resolve()
      }
      });
  })
}



// Get data from levelDB with key
function getLevelDBData(key) {

  return new Promise(function(resolve, reject) {
    db.get(key, function(err, value) {
      if (err) {
       return reject(err); 
      }      
      else {
        console.log("getLevelDBData success: ", JSON.stringify(value));
        //return resolve(JSON.stringify(value))
        return resolve(value) 
      };
    })
  })

}

// Add data to levelDB with value
function addDataToLevelDB(value) {

  return new Promise(function(resolve, reject) {
    let i = 0;
    db.createReadStream()
    .on('data', function(data) {
      i++;
    })
    .on('error', function(err) {
      return reject(err);
            //return console.log('Unable to read data stream!', err)
          })
    .on('close', function() {
      console.log('addDataToLevelDB (just before addLevelDBData) Block #' + i + " value # " + JSON.stringify(value));   
      addLevelDBData(i, value).then(function(data) {
        resolve(data);
      });
    });    
  });
}

function getCompleteBlocksDBData() {
  return new Promise(function(resolve, reject) {
    let datArray = [];
    
    db.createReadStream()
    .on("data", function(data) {
      //console.log("data:", data)
     datArray.push(data);
   })
    .on("error", function(error) {
      reject(error);
    })
    .on('close', function() {
      /*
      for(var i = 0; i < datArray.length; i++) {
        
        for(var property in datArray[i]) {
           //alert(property + "=" + obj[property]);
           console.log("getCompleteBlocksDBData resolved");
           console.log(property + " = " + obj[property]);
        }
        
        
      }
      */
      console.log("getCompleteBlocksDBData resolved");
      console.log("datArray length", datArray.length);

      console.log("datArray", datArray);
      
      resolve(datArray.sort((a, b) => a.key - b.key));
    });
  })
}

function deleteAllData() {
  getCompleteBlocksDBData().then(function(data) {
    for(var i = 0; i < data.length; i++) {
      db.del(i);
    }
  })
}

function printAllData() {
  getCompleteBlocksDBData().then(function(data) {
    for(var i = 0; i < data.length; i++) {
      console.log("print parse: ", JSON.stringify(data[i]));
    }
  })
}

/* ===== Testing ==============================================================|
|  - Self-invoking function to add blocks to chain                             |
|  - Learn more:                                                               |
|   https://scottiestech.info/2014/07/01/javascript-fun-looping-with-a-delay/  |
|                                                                              |
|  * 100 Milliseconds loop = 36,000 blocks per hour                            |
|     (13.89 hours for 500,000 blocks)                                         |
|    Bitcoin blockchain adds 8640 blocks per day                               |
|     ( new block every 10 minutes )                                           |
|  ===========================================================================*/

/*
(function theLoop (i) {
  setTimeout(function () {
    addDataToLevelDB('Testing data');
    if (--i) theLoop(i);
  }, 100);
})(10);
*/

module.exports = {
  addDataToLevelDB,
  addLevelDBData,
  getLevelDBData,
  getCompleteBlocksDBData
}