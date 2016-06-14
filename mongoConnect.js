exports.connect = function() {
	//define feature type:
	var mongoose = require('mongoose');
	mongoose.connect(process.env.MONGODB_URI);
	var Schema = mongoose.Schema;
	var featureSchema = new Schema({
		name: { type: String, required: true, unique: true },
		links: Array
	});
	var Feature = mongoose.model('Feature', featureSchema);

	function addFeature(newFeature){
		var addFeature = new Feature({
			name: newFeature.name,
			links:newFeature.links
		});
		addFeature.save(function(err){
			if (err) throw err;
			console.log('feature added to DB');
		});
	}
	function updateFeature(editedFeature){
		Feature.find({ name: editedFeature.name }, function(err, feature) {
			if (err) throw err;
			feature[0].links = editedFeature.links;		
			feature[0].save(function(err){
				if (err) throw err;
				console.log('user successfully updated');
			});
		});
	}
};