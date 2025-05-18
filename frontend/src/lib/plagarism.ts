// lib/plagiarism/index.ts
import { createHash } from 'crypto';

// Interface for plagiarism check results
export interface PlagiarismResult {
  isPlagiarized: boolean;
  similarityScore: number;
  matchedFiles: {
    studentId: number;
    fileName: string;
    similarityPercentage: number;
  }[];
}

// Interface for file metadata we'll store
export interface FileFingerprint {
  fileId: string;
  studentId: number;
  labName: string;
  fileName: string;
  fileHash: string;
  contentFingerprint: string; // For text-based similarity
  submissionDate: string;
}

// Helper function to generate a hash of file content
export async function generateFileHash(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (!event.target?.result) {
        reject(new Error('Failed to read file'));
        return;
      }
      
      const content = event.target.result;
      const hash = createHash('sha256');
      
      if (typeof content === 'string') {
        hash.update(content);
      } else {
        // Handle binary data
        hash.update(new Uint8Array(content as ArrayBuffer));
      }
      
      resolve(hash.digest('hex'));
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

// Function to generate content fingerprint (for text-based files)
export async function generateContentFingerprint(file: File): Promise<string> {
  // Only process text files and Jupyter notebooks
  if (!file.type.includes('text') && 
      !file.type.includes('javascript') && 
      !file.type.includes('typescript') && 
      !file.type.includes('json') &&
      !file.name.endsWith('.js') && 
      !file.name.endsWith('.ts') && 
      !file.name.endsWith('.jsx') && 
      !file.name.endsWith('.tsx') && 
      !file.name.endsWith('.py') && 
      !file.name.endsWith('.java') && 
      !file.name.endsWith('.c') && 
      !file.name.endsWith('.cpp') && 
      !file.name.endsWith('.cs') &&
      !file.name.endsWith('.ipynb')) {
    return '';
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      if (!event.target?.result || typeof event.target.result !== 'string') {
        reject(new Error('Failed to read file as text'));
        return;
      }
      
      let content = event.target.result;
      
      // Special handling for Jupyter notebooks (.ipynb files)
      if (file.name.endsWith('.ipynb')) {
        try {
          content = extractCodeFromNotebook(content);
        } catch (error) {
          console.error('Error processing Jupyter notebook:', error);
          // If parsing fails, use the original content
        }
      }
      
      // Normalize the content - remove whitespace, convert to lowercase
      const normalizedContent = content
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[^\w\s]/g, '');
      
      // Create a fingerprint (could be enhanced with more sophisticated algorithms)
      const fingerprint = createHash('sha256')
        .update(normalizedContent)
        .digest('hex');
      
      resolve(fingerprint);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file as text'));
    };
    
    reader.readAsText(file);
  });
}

// Extract code cells from Jupyter notebooks for comparison
function extractCodeFromNotebook(notebookContent: string): string {
  try {
    // Parse the notebook JSON
    const notebook = JSON.parse(notebookContent);
    
    // Check if it's a valid Jupyter notebook
    if (!notebook.cells || !Array.isArray(notebook.cells)) {
      return notebookContent; // Not a valid notebook format
    }
    
    // Extract only code cells (ignore markdown cells and outputs)
    const codeCells = notebook.cells
      .filter((cell: any) => cell.cell_type === 'code')
      .map((cell: any) => {
        if (Array.isArray(cell.source)) {
          return cell.source.join('');
        }
        return cell.source || '';
      });
    
    // Join all code cells into a single string
    return codeCells.join('\n');
  } catch (error) {
    console.error('Error parsing Jupyter notebook:', error);
    return notebookContent; // Return original content on error
  }
}

// Function to check plagiarism against existing files
export async function checkPlagiarism(
  file: File,
  studentId: number,
  labName: string,
  subjectId: number,
  supabase: any
): Promise<PlagiarismResult> {
  // Generate file hash
  const fileHash = await generateFileHash(file);
  
  // Generate content fingerprint for text-based comparison
  const contentFingerprint = await generateContentFingerprint(file);
  
  // For Jupyter notebooks, apply specialized processing
  const isNotebook = file.name.endsWith('.ipynb');
  let notebookAnalysis = null;
  
  if (isNotebook) {
    notebookAnalysis = await analyzeNotebook(file);
  }
  
  // Get existing file fingerprints from the database
  const { data: existingFingerprints, error } = await supabase
    .from('file_fingerprints')
    .select('*')
    .eq('labName', labName)
    .eq('subjectId', subjectId)
    .neq('studentId', studentId); // Exclude current student's files
  
  if (error) {
    console.error('Error fetching existing fingerprints:', error);
    return {
      isPlagiarized: false,
      similarityScore: 0,
      matchedFiles: []
    };
  }
  
  // Check for exact matches first (identical files)
  const exactMatches = existingFingerprints.filter(
    (fp: FileFingerprint) => fp.fileHash === fileHash
  );
  
  if (exactMatches.length > 0) {
    return {
      isPlagiarized: true,
      similarityScore: 1.0, // 100% match
      matchedFiles: exactMatches.map((match: FileFingerprint) => ({
        studentId: match.studentId,
        fileName: match.fileName,
        similarityPercentage: 100
      }))
    };
  }
  
  // If no exact matches and we have a content fingerprint, check for similar content
  const similarMatches = [];
  
  if (contentFingerprint) {
    // For text files and notebooks, do content-based comparison
    for (const fp of existingFingerprints) {
      if (fp.contentFingerprint) {
        let similarity = calculateTextSimilarity(contentFingerprint, fp.contentFingerprint);
        
        // For notebooks, if both current file and existing file are notebooks, 
        // use notebook-specific comparison if available
        if (isNotebook && fp.fileName.endsWith('.ipynb') && notebookAnalysis && fp.notebookData) {
          try {
            const existingNotebookData = JSON.parse(fp.notebookData);
            const notebookSimilarity = compareNotebooks(notebookAnalysis, existingNotebookData);
            
            // Use the notebook-specific similarity if it's higher than the text-based one
            if (notebookSimilarity > similarity) {
              similarity = notebookSimilarity;
            }
          } catch (error) {
            console.error('Error comparing notebooks:', error);
            // Fall back to text similarity if notebook comparison fails
          }
        }
        
        if (similarity > 0.7) { // 70% threshold for similarity
          similarMatches.push({
            studentId: fp.studentId,
            fileName: fp.fileName,
            similarityPercentage: Math.round(similarity * 100)
          });
        }
      }
    }
  }
  
  // Store the new file's fingerprint
  await storeFileFingerprint({
    fileId: `${studentId}-${labName}-${file.name}`,
    studentId,
    labName,
    fileName: file.name,
    fileHash,
    contentFingerprint,
    submissionDate: new Date().toISOString(),
    subjectId,
    notebookData: isNotebook && notebookAnalysis ? JSON.stringify(notebookAnalysis) : null
  }, supabase);
  
  return {
    isPlagiarized: similarMatches.length > 0,
    similarityScore: similarMatches.length > 0 
      ? Math.max(...similarMatches.map(m => m.similarityPercentage / 100)) 
      : 0,
    matchedFiles: similarMatches
  };
}

// Analyze Jupyter notebook structure for more accurate comparison
async function analyzeNotebook(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (!event.target?.result || typeof event.target.result !== 'string') {
        reject(new Error('Failed to read notebook file'));
        return;
      }
      
      try {
        const notebook = JSON.parse(event.target.result);
        const analysis = {
          codeFingerprints: [] as string[],
          codeTokens: {} as Record<string, number>,  // token frequency
          importStatements: [] as string[],
          cellCount: 0,
          codeCellCount: 0,
          markdownCellCount: 0
        };
        
        if (notebook.cells && Array.isArray(notebook.cells)) {
          analysis.cellCount = notebook.cells.length;
          
          // Process each cell
          notebook.cells.forEach((cell: any) => {
            // Count cell types
            if (cell.cell_type === 'code') {
              analysis.codeCellCount++;
              
              // Get code content
              let codeContent = '';
              if (Array.isArray(cell.source)) {
                codeContent = cell.source.join('');
              } else if (typeof cell.source === 'string') {
                codeContent = cell.source;
              }
              
              // Clean and normalize code
              const cleanedCode = codeContent
                .replace(/^\s*#.*$/gm, '')  // Remove comments
                .replace(/^\s*"""[\s\S]*?"""/gm, '')  // Remove docstrings
                .replace(/^\s*'''[\s\S]*?'''/gm, '')
                .trim();
              
              if (cleanedCode) {
                // Create fingerprint for this code cell
                const cellFingerprint = createHash('sha256')
                  .update(cleanedCode)
                  .digest('hex');
                analysis.codeFingerprints.push(cellFingerprint);
                
                // Extract import statements (Python specific)
                const importMatches = cleanedCode.match(/^\s*(import|from)\s+[\w\s.,*]+/gm);
                if (importMatches) {
                  analysis.importStatements.push(...importMatches);
                }
                
                // Count code tokens
                const tokens = cleanedCode
                  .replace(/[^\w\s]/g, ' ')
                  .split(/\s+/)
                  .filter(token => token.length > 2);  // Ignore short tokens
                
                tokens.forEach(token => {
                  analysis.codeTokens[token] = (analysis.codeTokens[token] || 0) + 1;
                });
              }
            } else if (cell.cell_type === 'markdown') {
              analysis.markdownCellCount++;
            }
          });
        }
        
        resolve(analysis);
      } catch (error) {
        console.error('Error analyzing notebook:', error);
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read notebook file'));
    };
    
    reader.readAsText(file);
  });
}

// Compare two notebook analyses for similarity
function compareNotebooks(notebook1: any, notebook2: any): number {
  // If either analysis is missing or invalid, fall back to general comparison
  if (!notebook1 || !notebook2) return 0;
  
  // Weighted scoring system
  let totalScore = 0;
  let maxScore = 0;
  
  // 1. Compare code fingerprints (highest weight - exact code cell matches)
  const fingerprintWeight = 0.5;
  maxScore += fingerprintWeight;
  
  if (notebook1.codeFingerprints.length > 0 && notebook2.codeFingerprints.length > 0) {
    // Count matching fingerprints
    let matchCount = 0;
    for (const fp1 of notebook1.codeFingerprints) {
      if (notebook2.codeFingerprints.includes(fp1)) {
        matchCount++;
      }
    }
    
    // Normalize by total fingerprints
    const maxFingerprints = Math.max(notebook1.codeFingerprints.length, notebook2.codeFingerprints.length);
    totalScore += fingerprintWeight * (matchCount / maxFingerprints);
  }
  
  // 2. Compare import statements (strong indicator of copying)
  const importWeight = 0.25;
  maxScore += importWeight;
  
  if (notebook1.importStatements.length > 0 && notebook2.importStatements.length > 0) {
    // Count matching imports
    let matchCount = 0;
    for (const imp1 of notebook1.importStatements) {
      if (notebook2.importStatements.includes(imp1)) {
        matchCount++;
      }
    }
    
    // Normalize by total imports
    const maxImports = Math.max(notebook1.importStatements.length, notebook2.importStatements.length);
    if (maxImports > 0) {
      totalScore += importWeight * (matchCount / maxImports);
    }
  }
  
  // 3. Compare code tokens (less precise but catches variable name changes)
  const tokenWeight = 0.25;
  maxScore += tokenWeight;
  
  // Calculate Jaccard similarity of tokens
  const tokens1 = Object.keys(notebook1.codeTokens);
  const tokens2 = Object.keys(notebook2.codeTokens);
  
  if (tokens1.length > 0 && tokens2.length > 0) {
    let intersection = 0;
    const union = new Set([...tokens1, ...tokens2]).size;
    
    for (const token of tokens1) {
      if (tokens2.includes(token)) {
        intersection++;
      }
    }
    
    totalScore += tokenWeight * (intersection / union);
  }
  
  // Normalize final score
  return totalScore / maxScore;
}

// Store file fingerprint in database
async function storeFileFingerprint(
  fingerprint: FileFingerprint & { subjectId: number, notebookData?: string | null },
  supabase: any
): Promise<void> {
  const { error } = await supabase
    .from('file_fingerprints')
    .insert([{
      file_id: fingerprint.fileId,
      student_id: fingerprint.studentId,
      lab_name: fingerprint.labName,
      subject_id: fingerprint.subjectId,
      file_name: fingerprint.fileName,
      file_hash: fingerprint.fileHash,
      content_fingerprint: fingerprint.contentFingerprint,
      notebook_data: fingerprint.notebookData,
      submission_date: fingerprint.submissionDate
    }]);
  
  if (error) {
    console.error('Error storing file fingerprint:', error);
  }
}

// Function to calculate text similarity
function calculateTextSimilarity(fingerprint1: string, fingerprint2: string): number {
  if (!fingerprint1 || !fingerprint2) return 0;
  
  // For now, using a simple comparison based on the fingerprints
  // You could enhance this with more sophisticated algorithms like:
  // - Levenshtein distance
  // - Jaccard similarity
  // - Cosine similarity with n-grams
  
  // For the simple version, compare the first N characters of the fingerprints
  // This is a placeholder - real plagiarism detection would be more complex
  const compareLength = 64; // First 64 chars of the hash
  const fp1 = fingerprint1.substring(0, compareLength);
  const fp2 = fingerprint2.substring(0, compareLength);
  
  let matchingChars = 0;
  for (let i = 0; i < compareLength; i++) {
    if (fp1[i] === fp2[i]) {
      matchingChars++;
    }
  }
  
  return matchingChars / compareLength;
}

// More advanced similarity detection for code files (optional enhancement)
export function calculateCodeSimilarity(code1: string, code2: string): number {
  // Normalize code - remove comments, whitespace, rename variables
  const normalizedCode1 = normalizeCode(code1);
  const normalizedCode2 = normalizeCode(code2);
  
  // Calculate similarity using token-based approach
  // This is simplified - a real implementation would be more robust
  return calculateTokenSimilarity(normalizedCode1, normalizedCode2);
}

function normalizeCode(code: string): string {
  return code
    .replace(/\/\/.*$/gm, '') // Remove single line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
    .replace(/\s+/g, '') // Remove whitespace
    .toLowerCase();
}

function calculateTokenSimilarity(text1: string, text2: string): number {
  // Simple implementation - in a real system, you'd use a more sophisticated algorithm
  const length = Math.min(text1.length, text2.length);
  let matches = 0;
  
  for (let i = 0; i < length; i++) {
    if (text1[i] === text2[i]) {
      matches++;
    }
  }
  
  return matches / length;
}