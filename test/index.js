/**
 * Created by vg on 25/11/14.
 */
'use strict';

const chai      = require('chai');
const coMocha   = require('co-mocha');
const expect    = chai.expect;
const Tree      = require('shark-tree');
const Logger    = require('shark-logger');
const path      = require('path');
const VError    = require('verror');
const sprintf   = require('extsprintf').sprintf;
const cofse     = require('co-fs-extra');

const TransformerPipe           = require('../');
const TransformerStylus         = require('shark-transformer-stylus');
const TransformerAutoprefixer   = require('shark-transformer-autoprefixer');

describe('Transformation', function() {
	before(function *() {
		this.logger = Logger({
			name: 'SharkTransformerPipe',
			deepLevel: 1
		});

		var destA = path.join(__dirname, './fixtures/blocks-a.css');
		this.destA = destA;
		this.destExpectA = path.join(__dirname, './fixtures/blocks-a.expect.css');
		var srcA = path.join(__dirname, './fixtures/blocks-a.styl');

		var destB = path.join(__dirname, './fixtures/blocks-b.css');
		this.destB = destB;
		this.destExpectB = path.join(__dirname, './fixtures/blocks-b.expect.css');
		var srcB = path.join(__dirname, './fixtures/blocks-b.styl');

		var files = {};
		files[destA] = [srcA, srcB];
		files[destB] = srcB;

		this.filesTree = yield Tree(files, this.logger);

		this.browsers = [
			'Android 2.3',
			'Android >= 4',
			'Chrome >= 20',
			'Firefox >= 24', // Firefox 24 is the latest ESR
			'iOS >= 6',
			'Opera >= 12',
			'Safari >= 6'
		];

		yield cofse.writeFile(destA);
		yield cofse.writeFile(destB);
	});

	it('should generate and write to file stylus string', function *() {
		try {
			var tree = yield TransformerPipe(this.filesTree, this.logger, [
				TransformerStylus.treeToTree.bind({}),
				TransformerAutoprefixer.treeToTree.bind({
					browsers: this.browsers
				})
			]);

			yield tree.writeContentToFiles();

			var contentByPipeA = yield cofse.readFile(this.destA, { encoding: 'utf8' });
			var contentShouldBeA = yield cofse.readFile(this.destExpectA, { encoding: 'utf8' });

			var contentByPipeB = yield cofse.readFile(this.destA, { encoding: 'utf8' });
			var contentShouldBeB = yield cofse.readFile(this.destExpectA, { encoding: 'utf8' });

			expect(contentByPipeA).equal(contentShouldBeA);
			expect(contentByPipeB).equal(contentShouldBeB);
		}
		catch (error) {
			console.error(sprintf('%r', error));
			throw new Error('error');
		}
	});
});
