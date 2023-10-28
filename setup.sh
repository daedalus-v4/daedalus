cat > .git/hooks/pre-commit << EOF
#!/bin/sh
bun x prettier --write core shared > /dev/null
cd dashboard
bun x prettier --write . > /dev/null
echo "Formatted files."
EOF

chmod +x .git/hooks/pre-commit

bun i -g pino-pretty