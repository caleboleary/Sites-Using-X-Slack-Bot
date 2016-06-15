//define feature type:
var mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);
var Schema = mongoose.Schema;
var featureSchema = new Schema({
	name: { type: String, required: true, unique: true },
	links: Array
});

var mongoConnect = {};

mongoConnect.Feature = mongoose.model('Feature', featureSchema);

mongoConnect.addFeature = function(newFeature){
	var addFeature = new mongoConnect.Feature({
		name: newFeature.name,
		links:newFeature.links
	});
	addFeature.save(function(err){
		if (err) throw err;
	});
};

mongoConnect.updateFeature = function(editedFeature){
	mongoConnect.Feature.find({ name: editedFeature.name }, function(err, feature) {
		if (err) throw err;
		feature[0].links = editedFeature.links;		
		feature[0].save(function(err){
			if (err) throw err;
		});
	});
};

module.exports = mongoConnect;