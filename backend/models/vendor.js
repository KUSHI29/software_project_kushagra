const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema({

    vendorName: {
        type: String,
        required: true
    },
    email: String,
    phone: String,
    gst: String,
    address: String
}, { timestamps: true });
module.exports = mongoose.model("Vendor", vendorSchema);
