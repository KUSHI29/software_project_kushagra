const Vendor = require("../models/Vendor");
const createVendor = async (req, res) => {
    try {
        const vendor = await Vendor.create(req.body);
        res.status(201).json({
            success: true,
            data: vendor
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
const searchVendor = async (req, res) => {
    try {
        const vendor = await Vendor.findOne({
            vendorName: req.params.vendorName
        });
        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: "Vendor not found"
            });
        }
        res.json({
            success: true,
            data: vendor
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
module.exports = {
    createVendor,
    searchVendor
};