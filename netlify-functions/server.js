// netlify-functions/server.js
exports.handler = async (event, context) => {
    // Your Node.js server code here
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Hello from Netlify serverless function!' }),
    };
  };  