let fs = require('fs');
let path = require('path');

exports.getAudioById = async (req, res) => {
  let name = req.params.name;
  console.log('name', name);

  try{
    // stream the image back by loading the file
    res.setHeader('Content-Type', 'audio/acc');
    fs.createReadStream(path.join('audio', name)).pipe(res);
  } catch {
    res.sendStatus(400);
  }
};