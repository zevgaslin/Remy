#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
./mvnw -q -DskipTests compile dependency:build-classpath -Dmdep.outputFile=target/import-classpath.txt
classpath=$(<target/import-classpath.txt)
exec java -cp "target/classes:$classpath" com.remy.backend.RecipeCatalogImport "${1:-recipes}"
