const { Xcronjob } = require('../index');

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false; 
  try {
    // Await the execution of Xcronjob
    const results = await Xcronjob();

    // Return successful results as response
    return {
      statusCode: 200,
      body: JSON.stringify(results.filter(Boolean)), 
    };
  } catch (error) {
    console.error('Error in cron job:', error.message);

    // Return error response
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
