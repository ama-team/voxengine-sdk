/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

var Chai = require('chai')
var expect = Chai.expect
var Commons = require('../../../../lib/logger/_common')
var TreeNode = Commons.TreeNode

describe('Unit', function () {
  describe('/logger', function () {
    describe('/_common.js', function () {
      describe('.TreeNode', function () {
        describe('#get', function () {
          it('returns stored value', function () {
            var tree = new TreeNode(1)
            expect(tree.get()).to.eq(1)
          })
          it('returns null if value is not set', function () {
            var tree = new TreeNode()
            expect(tree.get()).to.eq(null)
          })
        })

        describe('#set', function () {
          it('overrides stored value', function () {
            var tree = new TreeNode(1)
            tree.set(2)
            expect(tree.get()).to.eq(2)
          })
        })

        describe('#child', function () {
          it('returns added child', function () {
            var tree = new TreeNode(1)
            var child = new TreeNode(2)
            expect(tree.addChild('two', child)).to.eq(child)
            expect(tree.child('two')).to.eq(child)
          })
        })

        describe('#removeChild', function () {
          it('returns null for nonexisting child', function () {
            var tree = new TreeNode(1)
            expect(tree.removeChild('package')).to.be.null
          })

          it('deletes and returns existing child', function () {
            var tree = new TreeNode(1)
            var child = tree.addChild('package', new TreeNode(2))
            expect(tree.removeChild('package')).to.eq(child)
          })
        })

        describe('#branch', function () {
          it('returns full branch if it exists', function () {
            var path = ['alpha', 'beta']
            var root = new TreeNode()
            var child = root.addChild('alpha', new TreeNode())
            var grandchild = child.addChild('beta', new TreeNode())
            var result = root.branch(path)

            expect(result).to.have.lengthOf(3)
            expect(result[0]).to.eq(root)
            expect(result[1]).to.eq(child)
            expect(result[2]).to.eq(grandchild)
          })

          it('returns as much as present if not every part of path exists', function () {
            var path = ['alpha', 'beta']
            var root = new TreeNode()
            var child = root.addChild('alpha', new TreeNode())
            child.addChild('delta', new TreeNode())
            var result = root.branch(path)

            expect(result).to.have.lengthOf(2)
            expect(result[0]).to.eq(root)
            expect(result[1]).to.eq(child)
          })

          it('returns just root node for non-existing path', function () {
            var path = ['alpha', 'beta']
            var root = new TreeNode()
            var child = root.addChild('gamma', new TreeNode())
            child.addChild('delta', new TreeNode())
            var result = root.branch(path)

            expect(result).to.deep.eq([root])
          })
        })

        describe('#traverse', function () {
          it('returns root for empty path', function () {
            var root = new TreeNode(1)
            expect(root.traverse([])).to.eq(root)
          })

          it('returns null for nonexisting path', function () {
            var root = new TreeNode(1)
            expect(root.traverse(['package'])).to.be.null
          })

          it('returns target node for existing path', function () {
            var root = new TreeNode(1)
            var child = root.addChild('package', new TreeNode(2))
            child.addChild('subpackage', new TreeNode(3))
            expect(root.traverse(['package'])).to.eq(child)
          })
        })

        describe('#put', function () {
          it('puts value at target path', function () {
            var tree = new TreeNode(1)
            tree.addChild('segment', new TreeNode(2))
            var value = 4
            tree.put(['segment', 'segment', 'segment'], value)
            var middleware = tree.child('segment')
            expect(middleware).to.be.instanceOf(TreeNode)
            middleware = middleware.child('segment')
            expect(middleware).to.be.instanceOf(TreeNode)
            var target = middleware.child('segment')
            expect(target).to.be.instanceOf(TreeNode)
            expect(target.get()).to.eq(value)
          })
        })

        describe('#retrieve', function () {
          it('retrieves the value for existing branch', function () {
            var root = new TreeNode(1)
            var child = root.addChild('alpha', new TreeNode(2))
            var grandchild = child.addChild('beta', new TreeNode(3))
            var path = ['alpha', 'beta']
            var result = root.retrieve(path)

            expect(result).to.eq(grandchild.get())
          })

          it('retrieves far-most value for partially existing branch', function () {
            var root = new TreeNode(1)
            var child = root.addChild('alpha', new TreeNode(2))
            child.addChild('delta', new TreeNode(3))
            var path = ['alpha', 'beta']
            var result = root.retrieve(path)

            expect(result).to.eq(child.get())
          })
        })

        describe('#remove', function () {
          it('removes and returns value at path', function () {
            var tree = new TreeNode(1)
            var middleware = tree.addChild('package', new TreeNode(2))
            var target = middleware.addChild('package', new TreeNode(3))

            expect(tree.remove(['package', 'package'])).to.eq(target.get())
          })

          it('returns null for nonexisting path', function () {
            var tree = new TreeNode(1)

            expect(tree.remove(['package', 'package'])).to.be.null
          })

          it('disallows root node removal', function () {
            var tree = new TreeNode(1)
            var lambda = function () {
              tree.remove([])
            }

            expect(lambda).to.throw()
          })
        })
      })
    })
  })
})
