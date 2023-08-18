const DynamoDB = require("@aws-sdk/client-dynamodb");

(async function () {
    const dbclient = new DynamoDB.DynamoDBClient ({ region: process.env.AWS_REGION });
  
   try {
     const results = await dbclient.send(new DynamoDB.ListTablesCommand());
     console.log(results);
     results.TableNames.forEach(function (tableName, index) {
       console.log(tableName);
     });
   } catch (err) {
     console.error(err)
   }
 })();