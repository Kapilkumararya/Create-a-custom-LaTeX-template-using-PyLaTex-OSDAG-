import os
import shutil
import uuid
import traceback
import pandas as pd
import numpy as np
from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from pylatex import (Document, Section, Subsection, Command, Figure, 
                     NoEscape, Table, Tabular, TikZ, Axis, Plot, Package,
                     PageStyle, Head, Foot, StandAloneGraphic)
from PIL import Image, ImageDraw

app = Flask(__name__)
# Allow CORS for all domains to prevent browser blocking
CORS(app, resources={r"/*": {"origins": "*"}})

# ==========================================
# PART 1: DATA & CALCULATION ENGINE
# ==========================================

class BeamAnalyzer:
    def __init__(self, df):
        self.df = df
        # Determine Mode based on columns
        self.mode = self._determine_mode()
        
        if self.mode == 'CALCULATE':
            # Ensure sorted by position for calculation
            self.df = self.df.sort_values(by='Position (m)')
            self.results = self._analyze_loads()
        else:
            # Direct Plotting Mode (User provided results)
            self.df = self.df.sort_values(by='x')
            self.results = self._process_existing_results()

    def _determine_mode(self):
        # Check if we have result columns (x, shear, moment)
        cols = [c.lower() for c in self.df.columns]
        if 'shear' in cols and 'moment' in cols:
            return 'PLOT_ONLY'
        return 'CALCULATE'

    def _process_existing_results(self):
        """Just extracts the data from the dataframe for plotting."""
        return {
            'x': self.df['x'].values,
            'shear': self.df['shear'].values,
            'moment': self.df['moment'].values,
            'R_A': 0, # Not calculated in this mode
            'R_B': 0
        }

    def _analyze_loads(self):
        """Performs static equilibrium analysis on point loads."""
        length = 10.0
        if not self.df.empty:
             max_pos = self.df['Position (m)'].max()
             length = max(10.0, max_pos + 1.0)

        sum_moments = 0
        sum_forces = 0
        
        for index, row in self.df.iterrows():
            pos = row['Position (m)']
            load = row['Load (kN)']
            sum_moments += load * pos
            sum_forces += load
            
        r_b = sum_moments / length
        r_a = sum_forces - r_b
        
        x_coords = np.linspace(0, length, 500)
        key_points = self.df['Position (m)'].values
        
        if len(key_points) > 0:
            x_coords = np.unique(np.concatenate((x_coords, key_points, key_points - 1e-6, key_points + 1e-6)))
        
        x_coords = x_coords[(x_coords >= 0) & (x_coords <= length)]
        x_coords.sort()
        
        shear_forces = []
        bending_moments = []
        
        for x in x_coords:
            v = r_a
            m = r_a * x
            for index, row in self.df.iterrows():
                p_loc = row['Position (m)']
                p_val = row['Load (kN)']
                if p_loc < x:
                    v -= p_val
                    m -= p_val * (x - p_loc)
            shear_forces.append(v)
            bending_moments.append(m)
            
        return {
            'x': x_coords,
            'shear': np.array(shear_forces),
            'moment': np.array(bending_moments),
            'R_A': r_a,
            'R_B': r_b
        }

# ==========================================
# PART 2: HELPER FUNCTIONS
# ==========================================

def create_default_image(image_path):
    img = Image.new('RGB', (600, 200), color='white')
    d = ImageDraw.Draw(img)
    d.rectangle([50, 90, 550, 110], fill='lightgray', outline='black')
    d.polygon([(50, 110), (40, 130), (60, 130)], fill='black') 
    d.ellipse([(540, 125), (560, 135)], fill='black') 
    d.text((200, 50), "Simply Supported Beam (Default)", fill='black')
    img.save(image_path)
    return image_path

def load_data(filepath):
    try:
        # 1. Determine file type and read
        if filepath.endswith('.csv'):
            df = pd.read_csv(filepath)
        else:
            df = pd.read_excel(filepath)
            
        # 2. Normalize headers
        df.columns = df.columns.str.strip()
        
        # 3. Smart Mapping
        column_map = {}
        original_cols = [c.lower() for c in df.columns]

        # Case A: User uploaded Results (x, shear, moment) - matches your uploaded file
        if any(c in original_cols for c in ['shear force', 'shear', 'v']):
             # Map X
             for col in df.columns:
                 if col.lower() in ['x', 'pos', 'distance']: 
                     column_map[col] = 'x'
                     break
             # Map Shear
             for col in df.columns:
                 if 'shear' in col.lower():
                     column_map[col] = 'shear'
                     break
             # Map Moment
             for col in df.columns:
                 if 'moment' in col.lower():
                     column_map[col] = 'moment'
                     break

        # Case B: User uploaded Loads (Position, Load) - matches original requirement
        else:
            for col in df.columns:
                lower = col.lower()
                if any(x in lower for x in ['pos', 'loc', 'dist', 'x (m)']) and 'shear' not in lower:
                    column_map[col] = 'Position (m)'
                    break
            
            for col in df.columns:
                lower = col.lower()
                if col in column_map: continue
                if any(x in lower for x in ['load', 'force', 'weight', 'p (kn)']) and 'shear' not in lower:
                    column_map[col] = 'Load (kN)'
                    break
        
        if column_map:
            print(f"Smart Mapping found: {column_map}")
            df = df.rename(columns=column_map)
            
        return df
    except Exception as e:
        print(f"Error reading file: {e}")
        return pd.DataFrame()

# ==========================================
# PART 3: PDF GENERATOR
# ==========================================

def generate_pdf_doc(df, analysis_results, image_path, filename):
    geometry_options = {"tmargin": "1in", "lmargin": "1in"}
    doc = Document(geometry_options=geometry_options)
    
    doc.packages.append(Package('booktabs'))
    doc.packages.append(Package('pgfplots'))
    doc.packages.append(Package('float'))
    doc.preamble.append(NoEscape(r'\pgfplotsset{compat=1.18}'))
    
    doc.preamble.append(Command('title', 'Structural Analysis Report'))
    doc.preamble.append(Command('author', 'Automated Beam Analyzer'))
    doc.preamble.append(Command('date', NoEscape(r'\today')))
    doc.append(NoEscape(r'\maketitle'))
    
    doc.append(NoEscape(r'\tableofcontents'))
    doc.append(NoEscape(r'\newpage'))

    with doc.create(Section('Introduction')):
        doc.append("This report presents the structural analysis of a simply supported beam.")
        with doc.create(Subsection('Beam Description')):
            with doc.create(Figure(position='H')) as beam_fig:
                beam_fig.add_image(image_path, width=NoEscape(r'0.8\textwidth'))
                beam_fig.add_caption('Beam Configuration')

    with doc.create(Section('Data Table')):
        with doc.create(Table(position='H')) as table:
            # Dynamic Table Generation based on DF columns
            # Create a format string like 'c c c' based on column count
            col_format = ' '.join(['c'] * len(df.columns))
            
            with doc.create(Tabular(col_format, booktabs=True)) as tabular:
                # Header
                tabular.add_row(list(df.columns))
                tabular.add_hline()
                # Rows (Limit to first 30 rows to prevent PDF overflow if result file is huge)
                for index, row in df.head(30).iterrows():
                    # Format floats nicely, leave strings alone
                    formatted_row = []
                    for val in row:
                        if isinstance(val, (float, int)):
                            formatted_row.append(f"{val:.2f}")
                        else:
                            formatted_row.append(str(val))
                    tabular.add_row(formatted_row)
            table.add_caption('Provided Data')

    with doc.create(Section('Analysis')):
        with doc.create(Subsection('Shear Force Diagram')):
            with doc.create(TikZ()) as tikz:
                # FIX: Used NoEscape for the options to ensure \textwidth isn't escaped to \textbackslash{}textwidth
                with tikz.create(Axis(options=NoEscape(r'width=0.9\textwidth, height=6cm, xlabel={Position (m)}, ylabel={Shear (kN)}, grid=major'))) as plot:
                    # Filter out NaN or infinite values
                    valid_indices = np.isfinite(analysis_results['shear'])
                    x_clean = analysis_results['x'][valid_indices]
                    y_clean = analysis_results['shear'][valid_indices]
                    
                    coords = [f"({x:.3f},{y:.3f})" for x, y in zip(x_clean, y_clean)]
                    # Use a simpler plot command if too many points, but closedcycle is nice
                    plot.append(NoEscape(r'\addplot[draw=blue, fill=blue!30, thick] coordinates {' + " ".join(coords) + r'} \closedcycle;'))

        with doc.create(Subsection('Bending Moment Diagram')):
            with doc.create(TikZ()) as tikz:
                # FIX: Used NoEscape for the options to ensure \textwidth isn't escaped to \textbackslash{}textwidth
                with tikz.create(Axis(options=NoEscape(r'width=0.9\textwidth, height=6cm, xlabel={Position (m)}, ylabel={Moment (kNm)}, grid=major'))) as plot:
                    valid_indices = np.isfinite(analysis_results['moment'])
                    x_clean = analysis_results['x'][valid_indices]
                    y_clean = analysis_results['moment'][valid_indices]
                    
                    coords = [f"({x:.3f},{y:.3f})" for x, y in zip(x_clean, y_clean)]
                    plot.append(NoEscape(r'\addplot[draw=red, fill=red!30, thick] coordinates {' + " ".join(coords) + r'} \closedcycle;'))

    doc.generate_pdf(filename, clean_tex=True)
    return f"{filename}.pdf"

# ==========================================
# PART 4: FLASK ROUTES
# ==========================================

@app.route('/generate', methods=['POST'])
def handle_generation():
    if not shutil.which("pdflatex"):
        return jsonify({"error": "LaTeX compiler (pdflatex) not found. Please install MiKTeX/TeXLive and restart."}), 500

    try:
        if 'excel_file' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        unique_id = str(uuid.uuid4())[:8]
        # Keep original extension or detect it
        file_obj = request.files['excel_file']
        orig_name = file_obj.filename
        ext = '.csv' if orig_name.lower().endswith('.csv') else '.xlsx'
        
        excel_path = f"temp_data_{unique_id}{ext}"
        image_path = f"temp_beam_{unique_id}.png"
        output_filename = f"Report_{unique_id}"

        file_obj.save(excel_path)
        
        image_file = request.files.get('image_file')
        if image_file:
            image_file.save(image_path)
        else:
            create_default_image(image_path)

        # 3. Process Data
        df = load_data(excel_path)
        if df.empty:
            return jsonify({"error": "File is empty or unreadable"}), 400

        # Validate we have enough data to do SOMETHING
        cols = [c.lower() for c in df.columns]
        has_load_cols = 'position (m)' in df.columns and 'load (kn)' in df.columns
        has_result_cols = 'shear' in df.columns and 'moment' in df.columns
        
        if not (has_load_cols or has_result_cols):
             found_cols = ", ".join(df.columns.tolist())
             try:
                os.remove(excel_path)
                os.remove(image_path)
             except: pass
             return jsonify({
                "error": f"Columns not recognized.\nNeed: [Position, Load] OR [x, Shear, Moment].\nFound: [{found_cols}]"
            }), 400
        
        # 4. Analyze
        analyzer = BeamAnalyzer(df)
        
        # 5. Generate PDF
        pdf_path = generate_pdf_doc(df, analyzer.results, image_path, output_filename)
        
        try:
            os.remove(excel_path)
            os.remove(image_path)
        except: pass

        return send_file(pdf_path, as_attachment=True)

    except Exception as e:
        print("---------------- SERVER ERROR ----------------")
        traceback.print_exc()
        print("----------------------------------------------")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    print("Starting Flask Server on port 5000...")
    app.run(debug=True, port=5000)