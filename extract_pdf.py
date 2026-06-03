import PyPDF2

def extract_text_from_pdf(pdf_path):
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = ""
        for page_num in range(len(reader.pages)):
            page = reader.pages[page_num]
            text += page.extract_text()
        return text

if __name__ == '__main__':
    pdf_path = r"c:\Users\DELL\Downloads\solar-mtaani-instructor-os\public\plan\Building a Google Meet Web App.pdf"
    text = extract_text_from_pdf(pdf_path)
    with open("pdf_content.txt", "w", encoding="utf-8") as out:
        out.write(text)
    print("Extracted PDF to pdf_content.txt")
