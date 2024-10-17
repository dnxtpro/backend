const db = require("../model");
const Match = db.matchevent;
const { QueryTypes } = require('sequelize');
const sequelize = db.sequelize;


exports.borrarevento = async (req,res)=>{
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
        res.status(500).json({error:'error del servidor'})
    }
}