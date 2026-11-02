const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    staffId: { type: String, unique: true, sparse: true, trim: true },
    id: { type: String, unique: true, sparse: true, trim: true },
    profileId: { type: String, unique: true, sparse: true, trim: true },
    nationalId: { type: String, unique: true, sparse: true, trim: true },
    certificationNo: { type: String, unique: true, sparse: true, trim: true },
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
        "Nurse",
        "Receptionist",
        "Pharmacist",
        "Cashier",
        "Lab Tech",
        "Store Manager",
        "Ward",
        "Triage",
        "Radiology",
      ],
      required: true,
    },
  },
  { timestamps: true },
);

// Automatically intercept save hooks to generate secure Blowfish/bcrypt password hashes
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match input passwords during portal verification checks
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// 👇 FIX: Added 'staffs' as the 3rd argument to target your exact MongoDB Compass collection
module.exports = mongoose.model("User", UserSchema, "staffs");
