import re

with open(r'c:\Users\DELL\Downloads\solar-mtaani-instructor-os\components\meetings\useMeetingEngine.ts', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix types from livekit-processors
text = text.replace('krispFilterRef = useRef<KrispNoiseFilter | null>', 'krispFilterRef = useRef<any | null>')
text = text.replace('blurFilterRef = useRef<BackgroundBlur | null>', 'blurFilterRef = useRef<any | null>')
text = text.replace('virtualBgFilterRef = useRef<VirtualBackground | null>', 'virtualBgFilterRef = useRef<any | null>')
text = text.replace('SpeechRecognitionEvent', 'any')
text = text.replace('SpeechRecognitionErrorEvent', 'any')

with open(r'c:\Users\DELL\Downloads\solar-mtaani-instructor-os\components\meetings\useMeetingEngine.ts', 'w', encoding='utf-8') as f:
    f.write(text)

print('Fixed types')
