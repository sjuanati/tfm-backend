let fs = require('fs');
let path = require('path');

exports.getImageById = async (req, res) => {
  let name = req.params.name;

  try{
    // stream the image back by loading the file
    res.setHeader('Content-Type', 'image/jpeg');
    let raw = fs.createReadStream(path.join('uploads', name));
    raw.on('error', function(err) {
      res.sendStatus(400);
    });
    raw.pipe(res);
  } catch {
    res.sendStatus(400);
  }
};