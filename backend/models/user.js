const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: [
        "Administrator",
        "Doctor",
        "Receptionist",
        "Pharmacist",
        "Laboratory",
        "Triage",
        "Nurse",
        "Casier",
        "Ward Manager",
      ],
      required: true,
    },
    staffId: { type: String, unique: true, sparse: true },
    dept: { type: String, trim: true },
  },
  { timestamps: true },
);

// Pre-save hook to hash password before committing to the collection
// Updated for Mongoose 7+ async/await pattern
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method to check password validity safely
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
