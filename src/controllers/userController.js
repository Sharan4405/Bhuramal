import User from "../models/User.model.js";

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find(
      {},
      {
        __v: 0,
      },
    ).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.log("error fetching users:", error);
   return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
