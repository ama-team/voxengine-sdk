/* global it, describe */

//noinspection JSUnusedLocalSymbols
var sinon = require('sinon'),
  chai = require('chai'),
  should = chai.should(),
  expect = chai.expect,
  blackhole = chai.use(require('chai-string')),
  Commons = require('../../../lib/logger/_common'),
  Level = Commons.Level,
  toLevel = Commons.level,
  Threshold = Commons.Threshold,
  toThreshold = Commons.threshold;
var TreeNode = Commons.TreeNode;

describe('/logger', function () {
  describe('/_common.js', function () {
    describe('.level', function () {
      it('should correctly process exact naming', function () {
        expect(toLevel('INFO')).to.eq(Level.Info);
      });

      it('should correctly process invalid case naming', function () {
        expect(toLevel('info')).to.eq(Level.Info);
      });

      it('should correctly process threshold value', function () {
        expect(toLevel(Threshold.INFO)).to.eq(Level.Info);
      });

      it('should return ALL on unknown name', function () {
        expect(toLevel('acute')).to.eq(Level.All);
      });

      it('should return ALL on invalid input', function () {
        ['', null, undefined, {}, false].forEach(function (input) {
          expect(toLevel(input)).to.eq(Level.All);
        });
      });
    });

    describe('.toThreshold', function () {
      it('should correctly process valid input', function () {
        expect(toThreshold(Level.Info)).to.eq(Threshold.INFO);
      });

      it('should pass through valid threshold', function () {
        Object.keys(Threshold).forEach(function (key) {
          expect(toThreshold(Threshold[key])).to.eq(Threshold[key]);
        });
      });

      it('should return ALL value on unknown input', function () {
        expect(toThreshold(1234)).to.eq(Threshold.ALL);
      });

      it('should return ALL on invalid input', function () {
        ['', null, undefined, {}, false].forEach(function (input) {
          expect(toThreshold(input)).to.eq(Threshold.ALL);
        });
      });
    });

    describe('.TreeNode', function () {
      describe('#get', function () {
        it('should return stored value', function () {
          var tree = new TreeNode(1)
          expect(tree.get()).to.eq(1)
        })
      })

      describe('#set', function () {
        it('should override stored value', function () {
          var tree = new TreeNode(1)
          tree.set(2)
          expect(tree.get()).to.eq(2)
        })
      })

      describe('#child', function () {
        it('should return added child', function () {
          var tree = new TreeNode(1)
          var child = new TreeNode(2)
          expect(tree.add('two', child)).to.eq(child)
          expect(tree.child('two')).to.eq(child)
        })
      })

      describe('#branch', function () {
        it('should return full branch if it exists', function () {
          var path = ['alpha', 'beta']
          var root = new TreeNode()
          var child = root.add('alpha', new TreeNode())
          var grandchild = child.add('beta', new TreeNode())
          var result = root.branch(path)

          expect(result).to.have.lengthOf(3)
          expect(result[0]).to.eq(root)
          expect(result[1]).to.eq(child)
          expect(result[2]).to.eq(grandchild)
        })

        it('should return as much as present if not every part of path exists', function () {
          var path = ['alpha', 'beta']
          var root = new TreeNode()
          var child = root.add('alpha', new TreeNode())
          child.add('delta', new TreeNode())
          var result = root.branch(path)

          expect(result).to.have.lengthOf(2)
          expect(result[0]).to.eq(root)
          expect(result[1]).to.eq(child)
        })

        it('should return just root node for non-existing path', function () {
          var path = ['alpha', 'beta']
          var root = new TreeNode()
          var child = root.add('gamma', new TreeNode())
          child.add('delta', new TreeNode())
          var result = root.branch(path)

          expect(result).to.deep.eq([root])
        })
      })

      describe('#retrieve', function () {
        it('should retrieve the value for existing branch', function () {
          var root = new TreeNode(1)
          var child = root.add('alpha', new TreeNode(2))
          var grandchild = child.add('beta', new TreeNode(3))
          var path = ['alpha', 'beta']
          var result = root.retrieve(path)

          expect(result).to.eq(grandchild.get())
        })

        it('should retrieve far-most value for partially existing branch', function () {
          var root = new TreeNode(1)
          var child = root.add('alpha', new TreeNode(2))
          child.add('delta', new TreeNode(3))
          var path = ['alpha', 'beta']
          var result = root.retrieve(path)

          expect(result).to.eq(child.get())
        })
      })
    })
  })
})
