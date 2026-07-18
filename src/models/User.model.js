import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // whatsapp information

    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    // Delivery information
    fullAddress: {
      type: String,
      default: "",
      trim: true,
    },

    // customer statistics
    totalOrders: {
      type: Number,
      default: 0,
    },

    totalSpent: {
      type: Date,
      default: 0,
    },

    //   customer status

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

//Static method

userSchema.statics.findByPhoneNumber = function (phoneNumber) {
  return this.findOne({ phoneNumber });
};

const User = mongoose.model("User", userSchema);

export default User;
