#!/bin/sh

# Exit on error
set -o errexit

# This computation of package_path is done so to work both from a package
# installing this package and directly from the directory of this package.
#
# The "npm explore gu-db-core" command only works from a package that has
# installed this package.
package_path=$(npm explore nwjs-node-packager -- pwd 2>/dev/null||pwd)

node $package_path/src/start --params $2
