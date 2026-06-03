with open(r'c:\Users\DELL\Downloads\solar-mtaani-instructor-os\components\meetings\useMeetingEngine.ts', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace(r\"\'\", \"'\")

with open(r'c:\Users\DELL\Downloads\solar-mtaani-instructor-os\components\meetings\useMeetingEngine.ts', 'w', encoding='utf-8') as f:
    f.write(text)

print('Fixed')
