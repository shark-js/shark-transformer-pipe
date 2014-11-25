'use strict';

const Tree  = require('shark-tree');
const path  = require('path');
const chalk = require('chalk');

module.exports = function *TransformerPipe(tree, logger, transformers) {
	var oneDestTrees = [];
	var _tree = tree.getTree();
	for (var destPath in _tree) {
		if (!_tree.hasOwnProperty(destPath)) {
			continue;
		}

		var srcCollection = _tree[destPath];
		var srcArr = [];
		srcCollection.forEach(function(srcFile) {
			if (srcFile.getSrc()) {
				srcArr.push(srcFile.getSrc());
			}

		});

		var oneDestObj = {};
		oneDestObj[destPath] = {
			files: srcArr,
			options: srcCollection.getOptions()
		};
		var oneDestTree = yield Tree(oneDestObj, logger);


		var time = logger.time();
		var destPathAtStart = chalk.white(path.basename(destPath)) + ' at ' + path.dirname(destPath);
		var destPathAtFinish = chalk.green(path.basename(destPath)) + ' at ' + path.dirname(destPath);
		logger.info({
			opName: destPathAtStart,
			opType: logger.OP_TYPE.STARTED
		});

		for (var i = 0, len = transformers.length; i < len; i += 1) {
			var transformerMethod = transformers[i];
			oneDestTree = yield transformerMethod(oneDestTree, logger.child({
				deepLevel: logger.getDeepLevel() + 1,
				inPipe: true
			}));
		}

		logger.info({
			opName: destPathAtFinish,
			opType: logger.OP_TYPE.FINISHED,
			duration: time.delta()
		});
		logger.info("");

		oneDestTrees.push(oneDestTree);
	}

	oneDestTrees.forEach(function(oneDestTree) {
		tree.merge(oneDestTree);
	});

	return tree;
};