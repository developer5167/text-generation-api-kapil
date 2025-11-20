const userService = require('../services/userService');

const GetSubscriberdues = async (mobile, token) => {
    const response = await userService.GetSubscriberdues(mobile, token);
    return response ;
};
const GetChitDetails = async (mobile, token) => {
    const response = await userService.GetChitDetails(mobile, token);
    return response ;
};
module.exports = {
  GetSubscriberdues,
  GetChitDetails,
};
