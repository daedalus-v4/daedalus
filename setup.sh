cat > .git/hooks/pre-commit << EOF
#!/bin/sh
bun x prettier --write core shared
cd dashboard
bun x prettier --write .
EOF

chmod +x .git/hooks/pre-commit