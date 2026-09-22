const db = require("../model");
const Match = db.matchevent;
const { QueryTypes } = require('sequelize');
const sequelize = db.sequelize;


exports.borrarevento = async (req, res, next)=>{
    const match1Id = req.query.matchId; 
    console.log(match1Id,'hola')
    try{
        const lastEvent = await Match.findOne({
            where: { matchId: match1Id },
            order: [['id', 'DESC']]
          });

          if (lastEvent){
            console.log(lastEvent)
            await lastEvent.destroy();
            res.status(200).json('Borrado Con EXITO')
          }
          else{
            res.status(500).json({error:'no existe tal evento'})
          }
    }
    catch(error){
        const errObj = new Error('error del servidor');
    errObj.status = 500;
    next(errObj);
    }
}