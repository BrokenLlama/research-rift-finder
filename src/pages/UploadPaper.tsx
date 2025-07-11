import React, { useState } from 'react';
import Navigation from '@/components/Navigation';
import { groq } from '@/groq';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface FlaggedSection {
  text: string;
  suggestion: string;
  start: number;
  end: number;
}

const UploadPaper = () => {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plagiarismLoading, setPlagiarismLoading] = useState(false);
  const [flaggedSections, setFlaggedSections] = useState<FlaggedSection[]>([]);
  const [activeSuggestion, setActiveSuggestion] = useState<string | null>(null);
  const [activeRect, setActiveRect] = useState<DOMRect | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setFlaggedSections([]);
    setActiveSuggestion(null);
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);
    setLoading(true);
    try {
      let extractedText = '';
      if (uploadedFile.type === 'application/pdf') {
        // @ts-expect-error: pdfjs-dist types not found, but import works at runtime
        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf');
        // Set workerSrc to CDN
        (pdfjsLib as any).GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.worker.min.js';
        const arrayBuffer = await uploadedFile.arrayBuffer();
        const pdf = await (pdfjsLib as any).getDocument({ data: arrayBuffer }).promise;
        let textContent = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          textContent += content.items.map((item: any) => item.str).join(' ') + '\n';
        }
        extractedText = textContent;
      } else if (
        uploadedFile.type ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        const mammoth = await import('mammoth');
        const { value } = await mammoth.extractRawText({ arrayBuffer: await uploadedFile.arrayBuffer() });
        extractedText = value;
      } else if (uploadedFile.type === 'text/plain') {
        extractedText = await uploadedFile.text();
      } else {
        setError('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
        setLoading(false);
        return;
      }
      setText(extractedText);
    } catch (err) {
      setError('Failed to extract text from file.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckPlagiarism = async () => {
    setFlaggedSections([]);
    setActiveSuggestion(null);
    setPlagiarismLoading(true);
    setError(null);
    try {
      const prompt = `Analyze the following text for potential plagiarism. For any section that seems copied or unoriginal, return a JSON array of objects with the following fields: text (the problematic section), suggestion (a suggested rewrite), start (start index in the original text), end (end index in the original text). Only return the JSON array, nothing else.\n\nText:\n${text}`;
      const response = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are an academic writing assistant and plagiarism checker.' },
          { role: 'user', content: prompt },
        ],
        model: 'llama3-70b-8192',
        max_tokens: 2048,
        temperature: 0.2,
      });
      let flagged: FlaggedSection[] = [];
      try {
        flagged = JSON.parse(response.choices[0].message.content || '[]');
      } catch (e) {
        setError('Failed to parse Groq response.');
      }
      setFlaggedSections(flagged);
    } catch (err: any) {
      setError('Failed to check plagiarism: ' + (err.message || err));
    } finally {
      setPlagiarismLoading(false);
    }
  };

  // Helper to render text with highlights
  const renderHighlightedText = () => {
    if (!flaggedSections.length) {
      return <span>{text}</span>;
    }
    const elements = [];
    let lastIndex = 0;
    flaggedSections.forEach((section, idx) => {
      if (section.start > lastIndex) {
        elements.push(
          <span key={`plain-${idx}`}>{text.slice(lastIndex, section.start)}</span>
        );
      }
      elements.push(
        <span
          key={`flagged-${idx}`}
          style={{ background: '#fff3cd', cursor: 'pointer', borderRadius: 4, padding: '0 2px' }}
          onClick={e => {
            setActiveSuggestion(section.suggestion);
            const rect = (e.target as HTMLElement).getBoundingClientRect();
            setActiveRect(rect);
          }}
        >
          {text.slice(section.start, section.end)}
        </span>
      );
      lastIndex = section.end;
    });
    if (lastIndex < text.length) {
      elements.push(<span key="plain-end">{text.slice(lastIndex)}</span>);
    }
    return elements;
  };

  // Calculate plagiarism percentage
  const getPlagiarismPercentage = () => {
    if (!flaggedSections.length || !text.length) return 0;
    const flaggedLength = flaggedSections.reduce((sum, s) => sum + (s.end - s.start), 0);
    return Math.min(100, Math.round((flaggedLength / text.length) * 100));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8 relative">
        <div className="text-center mb-8">
          <h1 className="font-bold text-gray-900 mb-4 text-4xl">Plagiarism Checker</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload your research paper (PDF, DOCX, or TXT) to check for plagiarism and get AI-powered suggestions for improvement.
          </p>
        </div>
        <div className="bg-white rounded shadow p-6 max-w-6xl mx-auto">
          {flaggedSections.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-gray-700">Plagiarism Detected</span>
                <span className="font-mono text-lg text-gray-800">{getPlagiarismPercentage()}%</span>
              </div>
              <Progress value={getPlagiarismPercentage()} />
            </div>
          )}
          <div className="mb-4 flex items-center space-x-4">
            <button
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded shadow focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition"
              onClick={() => fileInputRef.current?.click()}
            >
              Browse File
            </button>
            <span className="text-gray-600 text-sm">{file ? file.name : 'No file selected'}</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          {loading && <p>Extracting text...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {text && (
            <div className="mb-4">
              <label className="block font-semibold mb-2">Extracted Text Review:</label>
              <div
                className="w-full h-[70vh] p-6 border rounded overflow-auto text-lg leading-relaxed font-mono bg-gray-50"
                style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', minHeight: 400, maxHeight: '70vh' }}
              >
                {renderHighlightedText()}
              </div>
            </div>
          )}
          {text && (
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              onClick={handleCheckPlagiarism}
            >
              {plagiarismLoading ? 'Checking...' : 'Check Plagiarism'}
            </button>
          )}
        </div>
        {/* Side panel for suggestions */}
        {activeSuggestion && (
          <div className="fixed top-0 right-0 h-full w-full max-w-md z-50 flex items-center justify-end bg-black bg-opacity-30" onClick={() => setActiveSuggestion(null)}>
            <Card className="h-full w-full max-w-md shadow-lg border-l border-gray-200 flex flex-col" onClick={e => e.stopPropagation()}>
              <CardHeader className="flex flex-row items-center justify-between p-6 pb-2">
                <CardTitle className="text-lg">Suggested Improvement</CardTitle>
                <button onClick={() => setActiveSuggestion(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-6 pt-0">
                <div className="text-gray-800 whitespace-pre-wrap text-base">{activeSuggestion}</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPaper; 