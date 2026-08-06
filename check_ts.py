# -*- coding: utf-8 -*-
import sys

path = sys.argv[1]
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix template literal backtick usage - replace broken ${...} with proper concatenation
# The issue is that PowerShell's $ got expanded before writing
# Let's just check if the file is valid
lines = content.split('\n')
errors = []
for i, line in enumerate(lines):
    if '${' in line and '```' not in line:
        # Check if it's a JSX template literal that should use backticks
        if 'className=' in line or 'style=' in line:
            errors.append(f'Line {i+1}: {line.strip()[:80]}')

if errors:
    print('Potential issues:')
    for e in errors:
        print(e)
else:
    print('No template literal issues found')
