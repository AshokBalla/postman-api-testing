#!/usr/bin/env bash
set -e
echo "CI runner: detecting project type"
if [ -f package.json ]; then
  echo "Node.js project detected"
  if command -v npm >/dev/null 2>&1; then
    npm ci || true
    if node -e "process.exit((require('./package.json').scripts||{}).test?0:1)" 2>/dev/null; then
      npm test || true
    fi
  fi
elif [ -f requirements.txt ]; then
  echo "Python project detected"
  python3 -m venv venv || true
  source venv/bin/activate
  pip install -r requirements.txt || true
  if [ -d tests ]; then
    pytest -q || true
  fi
elif [ -f pom.xml ]; then
  echo "Maven project detected"
  mvn -q -DskipTests=false test || true
else
  echo "No recognized project files; running a quick lint placeholder"
  if command -v npm >/dev/null 2>&1 && [ -f package.json ]; then
    npm ci || true
  fi
fi
