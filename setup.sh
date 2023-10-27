cat > .git/hooks/pre-commit << EOF
#!/bin/sh

echo "Formatting files..."
bun x prettier --write api bot shared > /dev/null
cd dashboard
bun x prettier --write . > /dev/null
EOF