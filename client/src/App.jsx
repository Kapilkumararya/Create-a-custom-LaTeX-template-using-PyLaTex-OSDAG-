import React, { useState, useRef } from 'react';
import { 
  Upload, FileText, Image as ImageIcon, CheckCircle, 
  AlertCircle, ArrowRight, Download, ChevronRight, Settings 
} from 'lucide-react';

export default function App() {
  const [step, setStep] = useState(1);
  const [excelFile, setExcelFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const excelInputRef = useRef(null);
  const imageInputRef = useRef(null);

  // --- Handlers ---

  const handleExcelUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setExcelFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const validateAndProceed = () => {
    if (!excelFile) {
      setError("Please upload the Force Data Excel file to proceed.");
      return;
    }
    setError(null);
    setStep(step + 1);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // 1. Prepare Form Data
      const formData = new FormData();
      formData.append('excel_file', excelFile);
      if (imageFile) {
        formData.append('image_file', imageFile);
      }

      // 2. Call Python Backend
      const response = await fetch('http://localhost:5000/generate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        // Parse the specific error message sent by Python
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Server error: Failed to generate report.');
      }

      // 3. Handle PDF Download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "Engineering_Report.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      
      setStep(4);
    } catch (err) {
      console.error(err);
      // Display the actual error message from Python in the UI
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Styles (Internal CSS Object) ---
  const styles = {
    container: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh',
      padding: '40px 20px',
      display: 'flex',
      justifyContent: 'center',
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
      width: '100%',
      maxWidth: '700px',
      padding: '40px',
      border: '1px solid #e9ecef',
      height: 'fit-content',
    },
    header: { textAlign: 'center', marginBottom: '40px' },
    title: { color: '#212529', margin: '0 0 10px 0', fontSize: '28px' },
    subtitle: { color: '#6c757d', margin: 0 },
    iconBox: {
      width: '60px', height: '60px', backgroundColor: '#0d6efd',
      borderRadius: '16px', display: 'flex', alignItems: 'center', 
      justifyContent: 'center', margin: '0 auto 20px auto', color: 'white'
    },
    stepIndicator: {
      display: 'flex', justifyContent: 'space-between', marginBottom: '40px',
      position: 'relative', padding: '0 20px'
    },
    stepLine: {
      position: 'absolute', top: '20px', left: 0, right: 0, height: '4px',
      backgroundColor: '#e9ecef', zIndex: 0
    },
    stepItem: {
      display: 'flex', flexDirection: 'column', alignItems: 'center', 
      zIndex: 1, position: 'relative'
    },
    stepCircle: (active, completed) => ({
      width: '40px', height: '40px', borderRadius: '50%',
      backgroundColor: active || completed ? '#0d6efd' : 'white',
      border: active || completed ? 'none' : '4px solid #e9ecef',
      color: active || completed ? 'white' : '#adb5bd',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 'bold', marginBottom: '8px', transition: 'all 0.3s'
    }),
    uploadBox: (active) => ({
      border: `3px dashed ${active ? '#0d6efd' : '#dee2e6'}`,
      borderRadius: '12px', padding: '40px', textAlign: 'center',
      cursor: 'pointer', backgroundColor: active ? '#f1f8ff' : '#fff',
      transition: 'all 0.2s', marginBottom: '20px'
    }),
    button: (variant = 'primary') => ({
      padding: '12px 24px', borderRadius: '8px',
      fontSize: '16px', fontWeight: 600, cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: '8px',
      backgroundColor: variant === 'primary' ? '#0d6efd' : '#f8f9fa',
      color: variant === 'primary' ? 'white' : '#212529',
      opacity: isGenerating ? 0.7 : 1,
      border: variant === 'secondary' ? '1px solid #dee2e6' : 'none'
    }),
    alert: {
      backgroundColor: '#fff3cd', color: '#856404', padding: '15px',
      borderRadius: '8px', marginBottom: '20px', border: '1px solid #ffeeba',
      display: 'flex', alignItems: 'center', gap: '10px'
    },
    errorAlert: {
      backgroundColor: '#f8d7da', color: '#721c24', padding: '15px',
      borderRadius: '8px', marginBottom: '20px', border: '1px solid #f5c6cb',
      display: 'flex', alignItems: 'center', gap: '10px'
    },
    previewRow: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '15px', border: '1px solid #e9ecef', borderRadius: '8px', marginBottom: '10px'
    },
    flexBetween: { display: 'flex', justifyContent: 'space-between', marginTop: '20px' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.iconBox}>
            <Settings size={32} />
          </div>
          <h1 style={styles.title}>Beam Report Generator</h1>
          <p style={styles.subtitle}>Automated Analysis & Documentation</p>
        </header>

        {/* Steps */}
        <div style={styles.stepIndicator}>
          <div style={styles.stepLine} />
          {[1, 2, 3, 4].map((num) => (
            <div key={num} style={styles.stepItem}>
              <div style={styles.stepCircle(step === num, step > num)}>
                {step > num ? <CheckCircle size={20} /> : num}
              </div>
            </div>
          ))}
        </div>

        {/* Content Area */}
        {step === 1 && (
          <div>
            <h2 style={{marginTop: 0}}>Upload Load Data</h2>
            <p style={{color: '#6c757d', marginBottom: '20px'}}>Upload your Excel (.xlsx) file containing load positions.</p>
            
            {error && (
              <div style={styles.alert}>
                <AlertCircle size={20} />
                {error}
              </div>
            )}

            <div 
              onClick={() => excelInputRef.current?.click()}
              style={styles.uploadBox(!!excelFile)}
            >
              <input 
                type="file" accept=".xlsx, .xls" ref={excelInputRef} 
                onChange={handleExcelUpload} style={{display: 'none'}} 
              />
              {excelFile ? (
                <>
                  <FileText size={48} color="#0d6efd" style={{marginBottom: '10px'}} />
                  <h3>{excelFile.name}</h3>
                  <span style={{color: '#6c757d'}}>Click to change file</span>
                </>
              ) : (
                <>
                  <Upload size={48} color="#adb5bd" style={{marginBottom: '10px'}} />
                  <h3>Click to Upload Excel</h3>
                </>
              )}
            </div>
            
            <div style={{display: 'flex', justifyContent: 'flex-end'}}>
              <button style={styles.button('primary')} onClick={validateAndProceed}>
                Next Step <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{marginTop: 0}}>Beam Diagram</h2>
            <p style={{color: '#6c757d', marginBottom: '20px'}}>Upload a schematic image of the beam (Optional).</p>

            <div 
              onClick={() => imageInputRef.current?.click()}
              style={styles.uploadBox(!!imageFile)}
            >
              <input 
                type="file" accept="image/*" ref={imageInputRef} 
                onChange={handleImageUpload} style={{display: 'none'}} 
              />
              {imageFile ? (
                <>
                  <ImageIcon size={48} color="#6f42c1" style={{marginBottom: '10px'}} />
                  <h3>{imageFile.name}</h3>
                </>
              ) : (
                <>
                  <ImageIcon size={48} color="#adb5bd" style={{marginBottom: '10px'}} />
                  <h3>Click to Upload Image</h3>
                  <span style={{color: '#6c757d'}}>Or skip to use default</span>
                </>
              )}
            </div>

            <div style={styles.flexBetween}>
              <button style={styles.button('secondary')} onClick={() => setStep(1)}>Back</button>
              <button style={styles.button('primary')} onClick={() => setStep(3)}>
                {imageFile ? "Next Step" : "Skip"} <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={{marginTop: 0}}>Review</h2>
            <p style={{color: '#6c757d', marginBottom: '20px'}}>Ready to generate report.</p>

            {error && (
              <div style={styles.errorAlert}>
                <AlertCircle size={20} />
                {error}
              </div>
            )}

            <div style={styles.previewRow}>
              <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <FileText size={20} color="#0d6efd" />
                <span>{excelFile?.name}</span>
              </div>
              <CheckCircle size={20} color="#198754" />
            </div>

            <div style={styles.previewRow}>
              <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <ImageIcon size={20} color="#6f42c1" />
                <span>{imageFile ? imageFile.name : "Default Generated Image"}</span>
              </div>
              <CheckCircle size={20} color="#198754" />
            </div>

            <div style={styles.flexBetween}>
              <button style={styles.button('secondary')} onClick={() => setStep(2)}>Back</button>
              <button style={styles.button('primary')} onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? "Analyzing..." : "Generate PDF"}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div style={{textAlign: 'center'}}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#d1e7dd',
              color: '#0f5132', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px auto'
            }}>
              <CheckCircle size={40} />
            </div>
            <h2>Success!</h2>
            <p style={{color: '#6c757d', marginBottom: '30px'}}>Your engineering report is ready.</p>
            
            <div style={{
              padding: '20px', border: '1px solid #e9ecef', borderRadius: '8px', 
              marginBottom: '30px', backgroundColor: '#f8f9fa'
            }}>
              <div style={{display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px'}}>
                <FileText size={30} color="#dc3545" />
                <div style={{textAlign: 'left'}}>
                  <div style={{fontWeight: 'bold'}}>Engineering_Report.pdf</div>
                  <div style={{fontSize: '12px', color: '#6c757d'}}>Generated Just Now</div>
                </div>
              </div>
              <button style={{...styles.button('primary'), width: '100%', justifyContent: 'center'}}>
                <Download size={18} /> Download Report
              </button>
            </div>

            <button 
              style={{...styles.button('secondary'), margin: '0 auto'}}
              onClick={() => {
                setStep(1);
                setExcelFile(null);
                setImageFile(null);
              }}
            >
              Start New Analysis
            </button>
          </div>
        )}

      </div>
    </div>
  );
}