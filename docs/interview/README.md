# AI Guruji interview preparation

Start with the **seven-day preparation plan** in section 2. Read a flow, trace it in the source, then explain it without looking at the answer. Use the mock interview in section 37 after completing the walkthroughs.

- [48-page visual PDF](../../output/pdf/AI-Guruji-Interview-Guide.pdf)
- [Searchable offline study page](index.html): open this file in a browser; includes question practice and local progress tracking.
- [Editable Markdown notes](../INTERVIEW_PREP.md)
- [Verification record](verification.json)

The guide contains 46 study sections, 43 answered interview questions, 9 diagrams and 10 coding exercises. It covers actual implementation details, current limitations and honest discussion of AI assistance. Source links in the HTML work when the file stays inside this repository; line numbers refer to the audited snapshot.

## Source and verification

Audited 8 November 2026 at commit `16c4932`. The guide follows the current Gemini implementation. Verification recorded 19 client tests, 54 backend tests and a successful client production build with Node 24.13.0. Provider HTTP responses in backend tests were mocked; no paid model or live account test was performed. All 48 PDF pages were rendered and visually reviewed.

These are learning notes, not a claim that every project path is production hardened. Read the security, persistence and training limitations before presenting the project.

## Rebuild and maintain

From the repository root, with Python 3 and `reportlab` installed:

```sh
python3 docs/interview/create_content.py
python3 docs/interview/build_guide.py
```

`create_content.py` contains the authored content and resolves source anchors into `guide.json`. `build_guide.py` produces the PDF, HTML, Markdown and companion JavaScript. Diagrams are vector drawings with no external assets. The PDF embeds system fonts when available and otherwise uses PDF standard fonts.

After source changes, update explanations and the audited date, commit and verification evidence in `create_content.py`; regenerate, rerun relevant application checks, render every PDF page and review the output. Updating anchor locations alone does not verify that the explanations remain correct. The preview and verification JSON are audit artifacts and must be refreshed separately.
