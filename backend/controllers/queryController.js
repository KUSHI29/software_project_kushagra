const Query= require("../models/Query");
 const saveQuery =async(req,res) =>{
    try{
        const query = await Query.create(req.body);

        res.status(201).json({
            success:true,
            data:query
        });
    }catch(err){
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
 };
 module.exports = {saveQuery};