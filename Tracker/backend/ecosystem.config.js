require("dotenv").config();

module.exports = {
  apps: [
    {
      name: `${process.env.APP_NAME}-backend-${process.env.PORT}`,
      port: process.env.PORT,
      script: "npm start",
      watch: false,
    },
  ],
};
