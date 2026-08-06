with open('lib/reportGenerator.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Replace lines 516-534 (1-indexed) with reordered if-blocks
# indices 515-533 (0-indexed)
new_lines = [
    '    if (level === "beauty-pro") {\n',
    '      return {\n',
    '        ...baseResult,\n',
    '        seasonColorAnalysis,\n',
    '        styleUpgradeContent,\n',
    '        personalPlan\n',
    '      };\n',
    '    }\n',
    '\n',
    '    if (level === "style-upgrade") {\n',
    '      return {\n',
    '        ...baseResult,\n',
    '        seasonColorAnalysis,\n',
    '        styleUpgradeContent\n',
    '      };\n',
    '    }\n',
    '\n',
    '    // first-look: 只输出faceInsight\n',
    '    return baseResult;\n',
]

lines = lines[:515] + new_lines + lines[534:]

with open('lib/reportGenerator.ts', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Fixed successfully')
for i, line in enumerate(lines[514:536], start=515):
    print(f'{i}: {line}', end='')
