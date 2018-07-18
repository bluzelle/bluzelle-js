parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )

cd ${parent_path}/../swarmDB/proto
protoc --js_out=import_style=commonjs,binary:../../proto database.proto
protoc --js_out=import_style=commonjs,binary:../../proto bluzelle.proto
protoc --js_out=import_style=commonjs,binary:../../proto audit.proto