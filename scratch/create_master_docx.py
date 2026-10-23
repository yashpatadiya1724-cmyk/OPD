# -*- coding: utf-8 -*-
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
import sys

def build_presentation_doc(output_path):
    doc = docx.Document()

    # Set 1-inch margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.85)
        section.bottom_margin = Inches(0.85)
        section.left_margin = Inches(0.85)
        section.right_margin = Inches(0.85)

    # Palette
    C_NAVY = RGBColor(15, 23, 42)      # #0F172A
    C_BLUE = RGBColor(2, 132, 199)     # #0284C7
    C_EMERALD = RGBColor(5, 150, 105)  # #059669
    C_GOLD = RGBColor(212, 175, 55)    # #D4AF37
    C_DARK = RGBColor(30, 41, 59)      # #1E293B
    C_GRAY = RGBColor(100, 116, 139)   # #64748B
    C_AMBER = RGBColor(217, 119, 6)    # #D97706

    def style_run(run, font_name="Calibri", size_pt=11, bold=False, italic=False, color_rgb=C_DARK):
        run.font.name = font_name
        run.font.size = Pt(size_pt)
        run.bold = bold
        run.italic = italic
        run.font.color.rgb = color_rgb

    def add_p(text="", font_name="Calibri", size_pt=11, bold=False, italic=False, color_rgb=C_DARK, 
              align=WD_ALIGN_PARAGRAPH.LEFT, space_before=0, space_after=6, line_spacing=1.15):
        p = doc.add_paragraph()
        p.alignment = align
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = line_spacing
        if text:
            run = p.add_run(text)
            style_run(run, font_name, size_pt, bold, italic, color_rgb)
        return p

    def add_h1(text):
        p = add_p(space_before=14, space_after=6)
        run = p.add_run(text)
        style_run(run, "Calibri", 18, bold=True, color_rgb=C_NAVY)
        return p

    def add_h2(text):
        p = add_p(space_before=10, space_after=4)
        run = p.add_run(text)
        style_run(run, "Calibri", 14, bold=True, color_rgb=C_BLUE)
        return p

    def add_h3(text):
        p = add_p(space_before=8, space_after=2)
        run = p.add_run(text)
        style_run(run, "Calibri", 12, bold=True, color_rgb=C_EMERALD)
        return p

    def set_cell_background(cell, hex_color):
        tcPr = cell._tc.get_or_add_tcPr()
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
        tcPr.append(shd)

    def set_cell_margins(cell, top=140, bottom=140, left=180, right=180):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
        tcPr.append(tcMar)

    def set_cell_border(cell, **kwargs):
        tcPr = cell._tc.get_or_add_tcPr()
        tcBorders = parse_xml(f'<w:tcBorders {nsdecls("w")}/>')
        for edge in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
            edge_data = kwargs.get(edge)
            if edge_data:
                val = edge_data.get('val', 'single')
                color = edge_data.get('color', 'E2E8F0')
                sz = edge_data.get('sz', '4')
                tag = f'<w:{edge} {nsdecls("w")} w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
                tcBorders.append(parse_xml(tag))
            else:
                tag = f'<w:{edge} {nsdecls("w")} w:val="none"/>'
                tcBorders.append(parse_xml(tag))
        tcPr.append(tcBorders)

    def add_callout(title, speech_text, speaker="ALL", bg_color="F0F9FF", border_color="0284C7", title_color=C_BLUE):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False
        
        cell = tbl.cell(0, 0)
        cell.width = Inches(6.8)
        set_cell_background(cell, bg_color)
        set_cell_margins(cell, top=140, bottom=140, left=200, right=180)
        set_cell_border(cell, 
                        left={'val': 'single', 'sz': '24', 'color': border_color},
                        top={'val': 'single', 'sz': '4', 'color': 'E2E8F0'},
                        right={'val': 'single', 'sz': '4', 'color': 'E2E8F0'},
                        bottom={'val': 'single', 'sz': '4', 'color': 'E2E8F0'})
        
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(3)
        run_spk = p.add_run(f"[{speaker}] — ")
        style_run(run_spk, "Calibri", 10, bold=True, color_rgb=title_color)
        
        run_title = p.add_run(title)
        style_run(run_title, "Calibri", 11, bold=True, color_rgb=title_color)

        p2 = cell.add_paragraph()
        p2.paragraph_format.space_before = Pt(2)
        p2.paragraph_format.space_after = Pt(0)
        run_text = p2.add_run(speech_text)
        style_run(run_text, "Calibri", 10.5, color_rgb=C_DARK)

        p_spacer = doc.add_paragraph()
        p_spacer.paragraph_format.space_before = Pt(0)
        p_spacer.paragraph_format.space_after = Pt(4)

    # =========================================================================
    # 1. COVER PAGE / HEADER BLOCK
    # =========================================================================
    p_inst = add_p("SILVER OAK UNIVERSITY  |  NAAC ACCREDITED GRADE 'A+'", 
                   size_pt=10, bold=True, color_rgb=C_BLUE, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)
    p_coll = add_p("SILVER OAK COLLEGE OF COMPUTER APPLICATIONS (SOCCA) — BCA PROGRAM", 
                   size_pt=9.5, bold=True, color_rgb=C_GRAY, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=8)
    
    p_title = add_p("PROJECT PRESENTATION & EVALUATION MASTER SCRIPT", 
                    size_pt=22, bold=True, color_rgb=C_NAVY, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=4)
    
    p_sub = add_p("Project Code: SOCCA - 12  |  Academic Year 2026–2027", 
                  size_pt=12, bold=True, color_rgb=C_GOLD, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=6)
    
    p_projname = add_p("MediQ: Smart OPD Queue Tracker, Healthcare Marketplace & Hyperlocal Pharmacy Fulfilment System", 
                       size_pt=14, bold=True, color_rgb=C_BLUE, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=14)

    # Metadata Box
    tbl_meta = doc.add_table(rows=2, cols=2)
    tbl_meta.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_meta.autofit = False
    for r in range(2):
        for c in range(2):
            cell = tbl_meta.cell(r, c)
            cell.width = Inches(3.4)
            set_cell_background(cell, "F8FAFC")
            set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
            set_cell_border(cell, 
                            top={'val': 'single', 'sz': '4', 'color': 'E2E8F0'},
                            bottom={'val': 'single', 'sz': '4', 'color': 'E2E8F0'},
                            left={'val': 'single', 'sz': '4', 'color': 'E2E8F0'},
                            right={'val': 'single', 'sz': '4', 'color': 'E2E8F0'})
    
    p0 = tbl_meta.cell(0, 0).paragraphs[0]
    r = p0.add_run("Student Project Team:\n")
    style_run(r, "Calibri", 9, bold=True, color_rgb=C_GRAY)
    r2 = p0.add_run("• Yash Patadiya (Lead Full-Stack / Architect)\n• Riya Dhariwal (Clinical Pacing & Patient UX)\n• Prajapati Riddhi (Pharmacy Logistics & ABDM)")
    style_run(r2, "Calibri", 9.5, bold=True, color_rgb=C_DARK)

    p1 = tbl_meta.cell(0, 1).paragraphs[0]
    r = p1.add_run("Project Mentor:\n")
    style_run(r, "Calibri", 9, bold=True, color_rgb=C_GRAY)
    r2 = p1.add_run("Prof. Yash Khatri\nAssistant Professor, SOCCA\nSilver Oak University")
    style_run(r2, "Calibri", 9.5, bold=True, color_rgb=C_DARK)

    p2 = tbl_meta.cell(1, 0).paragraphs[0]
    r = p2.add_run("Target Evaluation Rubric:\n")
    style_run(r, "Calibri", 9, bold=True, color_rgb=C_GRAY)
    r2 = p2.add_run("Evaluation Parameters (Judging Criteria) — 100 Marks Total\nWeightage: 20% + 20% + 20% + 20% + 15% + 5%")
    style_run(r2, "Calibri", 9.5, bold=True, color_rgb=C_BLUE)

    p3 = tbl_meta.cell(1, 1).paragraphs[0]
    r = p3.add_run("Live Deployment Links:\n")
    style_run(r, "Calibri", 9, bold=True, color_rgb=C_GRAY)
    r2 = p3.add_run("• Web App: https://smart-opd-queue-tracker.web.app\n• 4 Mobile APKs: Patient, Doctor, Pharmacy, Rider\n• TV Display: https://smart-opd-queue-tracker.web.app/?role=tv")
    style_run(r2, "Calibri", 9, bold=True, color_rgb=C_EMERALD)

    add_p(space_after=8)
    doc.add_page_break()

    # =========================================================================
    # 2. EVALUATION PARAMETERS (JUDGING CRITERIA) ALIGNMENT MATRIX
    # =========================================================================
    add_h1("1. Evaluation Parameters (Judging Criteria) & 100/100 Strategy Matrix")
    add_p("This master script is precisely structured around the official evaluation parameters shown in the judging rubric. Every single section of our team's speech is directly mapped to deliver maximum points across all 6 parameters.", color_rgb=C_GRAY, italic=True)

    tbl_eval = doc.add_table(rows=7, cols=5)
    tbl_eval.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_eval.autofit = False

    headers = ["Sr.", "Evaluation Parameter", "Weightage", "Official Description", "MediQ Direct Defense Strategy & Proof"]
    col_widths = [Inches(0.4), Inches(1.5), Inches(0.8), Inches(2.0), Inches(2.1)]
    
    # Header row
    hdr_cells = tbl_eval.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].width = col_widths[i]
        set_cell_background(hdr_cells[i], "0F172A")
        set_cell_margins(hdr_cells[i], top=100, bottom=100, left=100, right=100)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(title)
        style_run(r, "Calibri", 9.5, bold=True, color_rgb=RGBColor(255, 255, 255))

    rubric_data = [
        ("1", "Understanding & Ownership", "20%", 
         "Student's depth of understanding, clarity of concepts, and individual/team contribution", 
         "• Clear role division (Yash: Architecture & Web/Rider; Riya: Clinical EWMA & Triage; Riddhi: Pharmacy & ABDM).\n• Mastery over healthcare pain points, nosocomial infection data, and field study baseline ($N=250$)."),
        
        ("2", "Methodology & Approach", "20%", 
         "Proper use of scientific/engineering methodology and logical problem-solving approach", 
         "• 5-Stage Scientific Engineering Framework.\n• Dynamic EWMA mathematical formulation ($S_t = \\alpha Y_t + (1-\\alpha)S_{t-1}$).\n• Reverse ETA transit-aware Leave-Now engine calibrated with real hospital parking buffer."),
        
        ("3", "Innovation & Originality", "20%", 
         "Novelty of idea, creativity, and originality of the project", 
         "• First super-app unifying 'Zomato for Hospitals' + 'Smart OPD Queue' + 'Blinkit for Medicines'.\n• 70.9% generic savings via PMBJP / Jan Aushadhi engine.\n• Scheduled EV Rider fleet with 4-digit doorstep OTP handoff.\n• Zero-Login 10-ft TV display."),
        
        ("4", "Technical Implementation", "20%", 
         "Correctness of design, experimentation, coding, tools, and techniques used", 
         "• 4 Native Flutter Android Apps (100% clean Dart analyze, zero layout overflows).\n• React 19 + Vite 6 executive console with 14 clinical surfaces.\n• Cloud Firestore NoSQL real-time WebSocket listeners.\n• ACID transactions preventing negative pharmacy inventory.\n• Razorpay payment gateway integration."),
        
        ("5", "Poster Presentation & Communication", "15%", 
         "Visual clarity of poster and effectiveness of explanation", 
         "• Structured 8-minute timed speech with designated speaker handoffs.\n• Clear pointers to the 6 panels on the official SOCCA-12 exhibition poster.\n• Live dual-screen demonstration (Web Laptop + Android Phone via ADB)."),
        
        ("6", "Practical Relevance & Impact", "5%", 
         "Real-world applicability and usefulness of the project", 
         "• 87.2% reduction in non-clinical hospital waiting time (from 140.4 min to <18 min).\n• Direct alignment with Ayushman Bharat (ABDM) ABHA Locker & DPDP Act 2023.\n• High commercial startup viability (SaaS + delivery commission).")
    ]

    for row_idx, data in enumerate(rubric_data, start=1):
        row_cells = tbl_eval.rows[row_idx].cells
        bg_col = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate(data):
            row_cells[col_idx].width = col_widths[col_idx]
            set_cell_background(row_cells[col_idx], bg_col)
            set_cell_margins(row_cells[col_idx], top=80, bottom=80, left=100, right=100)
            set_cell_border(row_cells[col_idx],
                            top={'val': 'single', 'sz': '4', 'color': 'E2E8F0'},
                            bottom={'val': 'single', 'sz': '4', 'color': 'E2E8F0'},
                            left={'val': 'single', 'sz': '4', 'color': 'E2E8F0'},
                            right={'val': 'single', 'sz': '4', 'color': 'E2E8F0'})
            p = row_cells[col_idx].paragraphs[0]
            if col_idx == 0:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                r = p.add_run(text)
                style_run(r, "Calibri", 9, bold=True, color_rgb=C_NAVY)
            elif col_idx == 2:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                r = p.add_run(text)
                style_run(r, "Calibri", 9.5, bold=True, color_rgb=C_EMERALD)
            elif col_idx == 1:
                r = p.add_run(text)
                style_run(r, "Calibri", 9, bold=True, color_rgb=C_BLUE)
            else:
                r = p.add_run(text)
                style_run(r, "Calibri", 8.5, color_rgb=C_DARK)

    add_p(space_after=12)

    # =========================================================================
    # 3. INDIVIDUAL TEAM OWNERSHIP & ROLE MATRIX (CRITERION 1 - 20%)
    # =========================================================================
    add_h1("2. Team Ownership & Individual Contribution Matrix")
    add_p("To score full 20/20 on 'Understanding & Ownership', each team member must demonstrate complete mastery of their designated engineering domain while showing cohesive integration.", color_rgb=C_GRAY, italic=True)

    add_callout(
        "Lead System Architect & Full-Stack Engineer",
        "• Architectural Blueprint: Conceived the unified 3-pillar ecosystem integrating discovery, dynamic queueing, and pharmacy fulfilment.\n"
        "• Mobile Engineering: Built the MediQ Rider App (Ather EV telemetry, doorstep OTP verification, battery status, cold-chain sensor monitoring).\n"
        "• Web Console: Built the 14-surface React 19 + Vite 6 executive console with live Firebase listeners and role-based routing.\n"
        "• Backend & Payments: Engineered Cloud Functions v2 and integrated the Razorpay payment gateway with double-entry ledgers.\n"
        "• Deployment: Managed production Firebase hosting, multi-APK release pipeline, and ADB USB device streaming.",
        speaker="YASH PATADIYA",
        bg_color="EFF6FF",
        border_color="0284C7",
        title_color=C_BLUE
    )

    add_callout(
        "Clinical Algorithms & Patient Experience Lead",
        "• Field Study Research: Conducted 2-week time-motion study across 4 hospitals ($N=250$ patient journeys) tracking waiting room bottlenecks.\n"
        "• EWMA Mathematical Engine: Formulated and calibrated the Dynamic Exponential Weighted Moving Average ($S_t = \\alpha Y_t + (1-\\alpha)S_{t-1}$) with dynamic alpha adjustment.\n"
        "• Transit-Aware Leave-Now Engine: Integrated live Google Maps API traffic matrix with hospital parking buffers to compute optimal departure windows.\n"
        "• Multi-Factor Priority Triage: Engineered priority lane score algorithms (+50 bonus for senior citizens, pregnancy, and emergency triage).\n"
        "• Mobile Patient App: Designed the live digital token card, queue countdown meter, and instant slot reservation UI in Flutter.",
        speaker="RIYA DHARIWAL",
        bg_color="F0FDF4",
        border_color="059669",
        title_color=C_EMERALD
    )

    add_callout(
        "Pharmacy Logistics & Health Informatics Lead",
        "• Pharmacy Dark-Store Architecture: Designed the multi-tier pharmacy matching algorithm achieving sub-80ms lookup across retail counters.\n"
        "• ACID Stock Deduction: Engineered Firestore atomic transactions to prevent double-dispensing, race conditions, and negative inventory.\n"
        "• Jan Aushadhi (PMBJP) Engine: Formulated the active salt generic substitution matrix, proving an average of 70.9% cost reduction on chronic prescriptions.\n"
        "• ABDM & ABHA Locker Integration: Implemented National Health Authority standards for 14-digit ABHA card generation and FHIR health records.\n"
        "• Mobile Pharmacy & Doctor Apps: Developed doctor consultation console (Rx builder, delay broadcasting) and dark-store dispatch workbench in Flutter.",
        speaker="PRAJAPATI RIDDHI",
        bg_color="FEF3C7",
        border_color="D97706",
        title_color=C_AMBER
    )

    doc.add_page_break()

    # =========================================================================
    # 4. WORD-FOR-WORD PRESENTATION SCRIPT (TIMED: 8 MINUTES)
    # =========================================================================
    add_h1("3. The Complete Word-for-Word Presentation Script (Timed: 8 Minutes)")
    add_p("This script provides the exact spoken sentences, emotional hooks, physical gestures, and poster pointers. Practice this sequence to complete the presentation smoothly within the 8-minute window.", color_rgb=C_GRAY, italic=True)

    # --- Phase 1 ---
    add_h2("Phase 1: High-Impact Hook & Problem Statement (00:00 – 01:30)")
    add_callout(
        "The 60-Second Reality Check (Targets: Understanding & Ownership — 20%)",
        "\"Respected Judges and Professors, good morning. My name is Yash Patadiya, and alongside my co-researchers Riya Dhariwal and Prajapati Riddhi, guided by Prof. Yash Khatri, we proudly present MediQ (Project Code: SOCCA-12).\n\n"
        "Allow me to start with a question: Have you ever visited a hospital OPD with high fever, only to sit on a crowded metal bench for three agonizing hours, just to see a doctor for five short minutes?\n\n"
        "Every single day in India, over 3.5 crore patients endure this ordeal. But the delay is not the only tragedy. In those cramped, unventilated waiting rooms, a senior citizen with diabetes sits next to a contagious viral patient, creating dangerous vectors for cross-infection.\n\n"
        "And the frustration doesn't end there. After the consultation, the patient stands in another 40-minute pharmacy line, only to be told that critical medicines are out of stock. Even worse, they are forced to buy expensive branded drugs because nobody tells them about generic Jan Aushadhi alternatives.\n\n"
        "[GESTURE: Point to Poster Panel 1 — Field Study Graph]\n"
        "We did not rely on assumptions. We conducted an intensive 2-week time-motion field study across 4 hospitals, tracking 250 real patient journeys. We discovered that a staggering 140 minutes are wasted on non-clinical waiting, while average generic savings of 70.9% are completely ignored. MediQ was engineered to dismantle this broken system forever.\n\n"
        "I now invite Riya to explain our scientific methodology and mathematical predictive engine.\"",
        speaker="YASH PATADIYA",
        bg_color="EFF6FF",
        border_color="0284C7",
        title_color=C_BLUE
    )

    # --- Phase 2 ---
    add_h2("Phase 2: Scientific Methodology & Mathematical Modeling (01:30 – 03:00)")
    add_callout(
        "Dynamic EWMA & Transit-Aware 'Leave-Now' Engine (Targets: Methodology & Approach — 20%)",
        "\"Thank you, Yash. Respected Judges, traditional hospital queues fail because they treat human consultations like static calendar events. A doctor might spend 3 minutes on a routine viral case, but 20 minutes on a critical cardiac consultation. Fixed appointment slots collapse within the first hour.\n\n"
        "[GESTURE: Point to Poster Panel 2 — Mathematical Formulae]\n"
        "To solve this, MediQ implements a Dynamic Exponential Weighted Moving Average (EWMA) algorithm. Instead of using a fixed average, our prediction engine continually updates using the formula:\n\n"
        "       S_t = α · Y_t + (1 - α) · S_{t-1}\n\n"
        "Here, Y_t is the actual duration of the most recent consultation, S_{t-1} is the historical baseline, and alpha is dynamically tuned to 0.35. If a doctor encounters complex patients, our system self-corrects the entire downstream queue within 60 seconds without manual intervention.\n\n"
        "Furthermore, knowing your wait time is useless if you still have to travel and wait in the hospital. MediQ solves this through our Transit-Aware 'Leave-Now' Reverse ETA Engine:\n\n"
        "       T_{leave} = T_{consult_expected} - (T_{transit}(traffic) + T_{parking} + Δ_{buffer})\n\n"
        "By streaming live transit matrices and hospital parking buffers, MediQ sends a push notification telling the patient: 'Leave home at 10:18 AM to arrive exactly when your token is called.' As a result, waiting hall congestion drops by 85.1%—from 83.9 minutes down to just 12.5 minutes!\n\n"
        "I now hand over to Riddhi to present our 3-Pillar Architecture and Pharmacy Innovations.\"",
        speaker="RIYA DHARIWAL",
        bg_color="F0FDF4",
        border_color="059669",
        title_color=C_EMERALD
    )

    # --- Phase 3 ---
    add_h2("Phase 3: Innovations & Consumer Paradigms (03:00 – 04:30)")
    add_callout(
        "3 Pillars: Zomato for Hospitals + Blinkit for Medicines (Targets: Innovation & Originality — 20%)",
        "\"Thank you, Riya. Respected Judges, MediQ brings three proven consumer paradigms into Indian healthcare:\n\n"
        "[GESTURE: Point to Poster Panel 3 & 4 — The 3 Pillars]\n"
        "Pillar 1 — 'Zomato for Hospitals': Patients can explore verified hospitals, compare specialties, check transparent consultation fees, and inspect live queue depths before ever leaving home.\n\n"
        "Pillar 2 — 'Smart Pacing OPD Queue': Live token countdowns, multi-factor priority triage (+50 score bonus for senior citizens and emergency cases), and automated delay broadcasts.\n\n"
        "Pillar 3 — 'Blinkit for Medicines': The moment a doctor completes a consultation, MediQ's cloud engine matches the digital prescription against nearby dark-store inventories in under 80 milliseconds.\n\n"
        "Here lies our biggest healthcare innovation: our active salt Generic Substitution Engine. When a doctor prescribes Augmentin 625mg costing ₹220, MediQ automatically surfaces the Pradhan Mantri Jan Aushadhi generic equivalent at just ₹65—saving the patient 70.9% instantly! If the patient prefers home recovery, our Scheduled EV Rider fleet delivers the medicine in temperature-controlled bags with 4-digit secret doorstep OTP handoff.\n\n"
        "Moreover, MediQ integrates Ayushman Bharat (ABDM) standards, generating digital ABHA cards and syncing e-prescriptions directly with India's National Health Locker.\n\n"
        "I now invite Yash back to demonstrate our technical implementation and live working code.\"",
        speaker="PRAJAPATI RIDDHI",
        bg_color="FEF3C7",
        border_color="D97706",
        title_color=C_AMBER
    )

    # --- Phase 4 ---
    add_h2("Phase 4: Technical Implementation & Code Architecture (04:30 – 06:00)")
    add_callout(
        "Production Stack, ACID Firestore & 4 Flutter Apps (Targets: Technical Implementation — 20%)",
        "\"Thank you, Riddhi. Respected Judges, a great idea is only as good as its technical execution. MediQ is not a mockup; it is a battle-tested, production-ready enterprise ecosystem:\n\n"
        "[GESTURE: Point to Poster Panel 5 — Technical Architecture Diagram]\n"
        "1. Multi-Client Mobile Suite: We engineered 4 dedicated native Flutter Android applications:\n"
        "   • Patient App: Real-time token tracking, slot booking, and Leave-Now engine.\n"
        "   • Doctor Console: Dynamic room assignment, 3-minute patient response countdown, and delay broadcast.\n"
        "   • Pharmacy App: Micro-dark store batch management and generic price analysis.\n"
        "   • Rider App: EV Ather telematics, battery telemetry, and doorstep OTP verification.\n"
        "   All 4 apps pass Flutter Dart analyze with ZERO errors and zero layout overflow on any device from 320px to tablet.\n\n"
        "2. Executive Web Console: Built with React 19 and Vite 6, hosting 14 responsive surfaces, deployed globally on Firebase Hosting.\n\n"
        "3. ACID Concurrency & Zero Negative-Stock: To prevent two patients from reserving the last medicine strip simultaneously, we engineered atomic Cloud Firestore Transactions with pre-conditional batch validation. If stock hits zero, alternative pharmacies are instantly suggested.\n\n"
        "4. Payments & Security: Real-time Razorpay payment gateway integration with automated double-entry ledger settlement, fully compliant with India's DPDP Act 2023.\n\n"
        "Let us now show you the live system in action!\"",
        speaker="YASH PATADIYA",
        bg_color="EFF6FF",
        border_color="0284C7",
        title_color=C_BLUE
    )

    # --- Phase 5 ---
    add_h2("Phase 5: Live Dual-Screen Demonstration (06:00 – 07:30)")
    add_callout(
        "High-Impact Live Workflow Demo (Targets: Poster Presentation & Communication — 15%)",
        "[LIVE DEMO ACTION: Yash opens live web portal on laptop: https://smart-opd-queue-tracker.web.app]\n"
        "\"Judges, observe my laptop screen. Here is our live Web Hospital Directory. I select CityCare Central Hospital, pick Dr. Rajesh Mehta in General Medicine, and book a digital token. Look at how the token generates in 0.2 seconds—Token #14 is live on Firestore!\n\n"
        "[LIVE DEMO ACTION: Riya switches tab to Doctor Consultation Console]\n"
        "Riya speaks: 'Now look at the Doctor Console. Dr. Mehta sees Token #14 arrive instantly via WebSocket stream. He clicks 'Call Patient'. Immediately, the 3-minute response timer activates, and the patient receives a sound chime alert and Leave-Now status. Dr. Mehta finishes the consultation and clicks 'Prescribe Medicines'. Look: the Jan Aushadhi generic comparison highlights ₹155 savings instantly!'\n\n"
        "[LIVE DEMO ACTION: Riddhi holds up the connected Android phone running the Rider App]\n"
        "Riddhi speaks: 'Now look at our real Android smartphone connected via ADB. The rider app shows Order MEDIQ-SLOT-8821 dispatched! The Ather EV battery is streaming at 88%, cold-chain bag temperature is 4.4°C, and the customer has a 4-digit secret OTP (7391). When I enter 7391 into the terminal—SUCCESS! The order is closed, and inventory is atomised in Firestore in real time!'\n\n"
        "[LIVE DEMO ACTION: Yash shows the Zero-Login TV Display: ?role=tv]\n"
        "Yash speaks: 'And for the hospital lobby, our 10-ft zero-login Waiting Room TV updates with zero credentials needed!'\"",
        speaker="ALL THREE TEAM MEMBERS",
        bg_color="F0FDF4",
        border_color="059669",
        title_color=C_EMERALD
    )

    # --- Phase 6 ---
    add_h2("Phase 6: Real-World Social & Commercial Impact (07:30 – 08:30)")
    add_callout(
        "Empirical Results & Vision (Targets: Practical Relevance & Impact — 5%)",
        "\"Respected Judges, to conclude: MediQ proves that technology can restore human dignity to healthcare.\n\n"
        "[GESTURE: Point to Poster Panel 6 — Verified Results Table]\n"
        "In our validated trials:\n"
        "• Total non-clinical time wasted collapsed from 140.4 minutes to under 18 minutes—an 87.2% reduction.\n"
        "• Generic drug cost savings averaged 70.9%, making life-saving treatments accessible to every Indian family.\n"
        "• Unfilled prescription rates dropped to absolute ZERO.\n\n"
        "MediQ requires zero expensive proprietary hardware. Any district hospital or private clinic can onboard in 5 minutes using their existing smartphones and desktop browsers. Our business model combines a modest B2B SaaS clinic subscription with hyperlocal pharmacy delivery logistics.\n\n"
        "Under the mentorship of Prof. Yash Khatri at Silver Oak University, we have not just written code; we have built a viable, scalable healthtech platform ready for pilot deployment.\n\n"
        "Thank you. We are now delighted to answer your questions and open the technical defense!\"",
        speaker="YASH PATADIYA",
        bg_color="EFF6FF",
        border_color="0284C7",
        title_color=C_BLUE
    )

    doc.add_page_break()

    # =========================================================================
    # 5. POSTER PRESENTATION & COMMUNICATION GUIDE (CRITERION 5 - 15%)
    # =========================================================================
    add_h1("4. Poster Navigation & Visual Clarity Pointer Guide")
    add_p("To score full 15/15 on 'Poster Presentation & Communication', synchronize your speech with the 6 visual panels on your official SOCCA-12 exhibition poster:", color_rgb=C_GRAY, italic=True)

    tbl_poster = doc.add_table(rows=7, cols=4)
    tbl_poster.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_poster.autofit = False

    p_headers = ["Poster Panel", "Visual Element on Poster", "Speaker Lead", "Exact Verbal Pointer Cue"]
    p_widths = [Inches(1.1), Inches(1.8), Inches(1.2), Inches(2.7)]

    for i, title in enumerate(p_headers):
        tbl_poster.rows[0].cells[i].width = p_widths[i]
        set_cell_background(tbl_poster.rows[0].cells[i], "0F172A")
        set_cell_margins(tbl_poster.rows[0].cells[i], top=90, bottom=90, left=90, right=90)
        p = tbl_poster.rows[0].cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(title)
        style_run(r, "Calibri", 9.5, bold=True, color_rgb=RGBColor(255, 255, 255))

    p_data = [
        ("Panel 1 (Top Left)", "Field Study Charts & Problem Stats", "Yash", 
         "\"As you can see in Panel 1, our 2-week hospital time-motion audit proves that patients waste 140.4 minutes on non-clinical waiting...\""),
        ("Panel 2 (Top Mid)", "Dynamic EWMA & Leave-Now Equations", "Riya", 
         "\"Moving to Panel 2, here is our core mathematical innovation: the self-correcting EWMA formula S_t and reverse ETA transit model...\""),
        ("Panel 3 (Top Right)", "3 Core Ecosystem Architectural Pillars", "Riddhi", 
         "\"In Panel 3, we illustrate the synergy of our three pillars: Hospital Discovery, Smart Queue Pacing, and Blinkit Pharmacy Fulfilment...\""),
        ("Panel 4 (Bottom Left)", "Blinkit Dark-Store & Generic Saving Matrix", "Riddhi", 
         "\"Looking at Panel 4, our generic substitution table proves an empirical 70.9% price reduction across common chronic medications...\""),
        ("Panel 5 (Bottom Mid)", "Multi-Tier Flutter & React System Architecture", "Yash", 
         "\"In Panel 5, our full-stack architecture diagram details the 4 Flutter Android apps, React 19 web portal, and Firestore ACID layers...\""),
        ("Panel 6 (Bottom Right)", "Empirical Impact Results & ABDM Alignment", "Yash", 
         "\"Finally, in Panel 6, our comparative results table highlights the 87.2% overall waiting time elimination and ABDM health locker sync...\"")
    ]

    for row_idx, data in enumerate(p_data, start=1):
        cells = tbl_poster.rows[row_idx].cells
        bg_col = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate(data):
            cells[col_idx].width = p_widths[col_idx]
            set_cell_background(cells[col_idx], bg_col)
            set_cell_margins(cells[col_idx], top=70, bottom=70, left=90, right=90)
            set_cell_border(cells[col_idx],
                            top={'val': 'single', 'sz': '4', 'color': 'E2E8F0'},
                            bottom={'val': 'single', 'sz': '4', 'color': 'E2E8F0'},
                            left={'val': 'single', 'sz': '4', 'color': 'E2E8F0'},
                            right={'val': 'single', 'sz': '4', 'color': 'E2E8F0'})
            p = cells[col_idx].paragraphs[0]
            if col_idx == 0:
                r = p.add_run(text)
                style_run(r, "Calibri", 9, bold=True, color_rgb=C_NAVY)
            elif col_idx == 2:
                r = p.add_run(text)
                style_run(r, "Calibri", 9, bold=True, color_rgb=C_BLUE)
            else:
                r = p.add_run(text)
                style_run(r, "Calibri", 8.5, color_rgb=C_DARK)

    doc.add_page_break()

    # =========================================================================
    # 6. JURY VIVA DEFENSE MASTERCLASS (TOP 12 TOUGHEST QUESTIONS & MODEL ANSWERS)
    # =========================================================================
    add_h1("5. Jury Defense Masterclass (Top 12 Toughest Questions & Model Answers)")
    add_p("Judges will test your conceptual depth, edge-case resilience, and coding ownership. Use these exact structured answers to defend your project with authority:", color_rgb=C_GRAY, italic=True)

    def add_qa_box(q_num, question, primary_speaker, answer, technical_proof):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False
        cell = tbl.cell(0, 0)
        cell.width = Inches(6.8)
        set_cell_background(cell, "FFFFFF")
        set_cell_margins(cell, top=120, bottom=120, left=180, right=160)
        set_cell_border(cell,
                        left={'val': 'single', 'sz': '20', 'color': '0284C7'},
                        top={'val': 'single', 'sz': '4', 'color': 'CBD5E1'},
                        right={'val': 'single', 'sz': '4', 'color': 'CBD5E1'},
                        bottom={'val': 'single', 'sz': '4', 'color': 'CBD5E1'})
        
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(2)
        rq = p.add_run(f"Q{q_num}: {question}\n")
        style_run(rq, "Calibri", 10.5, bold=True, color_rgb=C_NAVY)
        
        rspk = p.add_run(f"Recommended Lead Speaker: {primary_speaker}\n")
        style_run(rspk, "Calibri", 9, bold=True, color_rgb=C_BLUE)

        p_ans = cell.add_paragraph()
        p_ans.paragraph_format.space_before = Pt(2)
        p_ans.paragraph_format.space_after = Pt(4)
        rans = p_ans.add_run(f"Model Answer: {answer}")
        style_run(rans, "Calibri", 10, color_rgb=C_DARK)

        p_proof = cell.add_paragraph()
        p_proof.paragraph_format.space_before = Pt(0)
        p_proof.paragraph_format.space_after = Pt(0)
        rproof = p_proof.add_run(f"Technical Proof / Code Reference: {technical_proof}")
        style_run(rproof, "Calibri", 9, italic=True, color_rgb=C_EMERALD)

        p_spc = doc.add_paragraph()
        p_spc.paragraph_format.space_before = Pt(0)
        p_spc.paragraph_format.space_after = Pt(4)

    add_qa_box(
        "1",
        "Why did you build a new system instead of using Practo or Google Calendar appointments?",
        "Yash Patadiya",
        "Practo and Google Calendar provide static appointment booking, not real-time clinical pacing. In an OPD, consultations do not conform to 15-minute fixed slots. When emergencies occur, static schedules collapse, forcing patients to wait hours. MediQ is a dynamic queue engine powered by EWMA and real-time transit telemetry, informing patients when to leave home based on live doctor velocity.",
        "Demonstrate our EWMA formula and Leave-Now countdown engine in PatientView.jsx (lines 510–527)."
    )

    add_qa_box(
        "2",
        "What happens if the doctor has an emergency surgery or takes an unexpected break?",
        "Prajapati Riddhi",
        "In the Doctor Console App, we engineered a dedicated 'Broadcast Delay & Pause Queue' module. The doctor selects the clinical reason (e.g., 'Emergency OT call') and delay duration (e.g., 30 mins). With one click, Firestore triggers instant push alerts to all downstream patients, recalculating their estimated arrival times so nobody sits idle in the waiting hall.",
        "Show Doctor Dashboard 'Delay Broadcast' modal in DoctorDashboard.jsx and doctor_app/lib/main.dart (lines 800–895)."
    )

    add_qa_box(
        "3",
        "How do you prevent starvation for normal patients when high-priority patients arrive?",
        "Riya Dhariwal",
        "We implemented a Starvation-Guard Priority Algorithm. Priority lane patients (seniors, pregnant women) receive an initial +50 score bonus. However, for every 5 minutes a normal patient waits past their estimated time, they accumulate aging points. Once aging points exceed the bonus threshold, the normal patient is served next, guaranteeing that no patient is starved indefinitely.",
        "Reference Section 5.2 of README.md and priority sorting in patient_app/lib/main.dart."
    )

    add_qa_box(
        "4",
        "How do you handle concurrent orders for the last medicine strip in pharmacy inventory?",
        "Prajapati Riddhi",
        "We avoid naive read-modify-writes. Instead, we use Cloud Firestore atomic Transactions (runTransaction). The transaction reads the current batch stock, validates that available_units >= requested_qty, and executes the deduction atomically. If another transaction modifies the document in between, the transaction automatically retries or fails safely with zero negative stock.",
        "Reference ACID stock transaction handler in pharmacy_app/lib/stock_management.dart and README.md Section 5.4."
    )

    add_qa_box(
        "5",
        "How does your system comply with India's Digital Personal Data Protection (DPDP) Act 2023?",
        "Yash Patadiya",
        "MediQ implements Consent-Artifact architecture. When booking a token, patients must explicitly consent to medical data processing. ABHA health IDs are pseudonymized, e-prescriptions are encrypted at rest with AES-256 in Cloud Firestore Mumbai, and audit logs are recorded for every record access.",
        "Show saveDpdpConsent() and getDpdpConsent() in firebase.js and PatientView.jsx."
    )

    add_qa_box(
        "6",
        "Why did you choose Flutter for mobile instead of React Native or pure Web?",
        "Yash Patadiya",
        "Healthcare apps require 60fps hardware-accelerated rendering, offline local SQLite/SharedPreferences persistence, and direct Bluetooth/telematics access (for EV rider battery and temperature bag probes). Flutter compiles directly to ARM native machine code with zero JS bridge overhead, ensuring sub-100ms startup times.",
        "Show all 4 Flutter projects in patient_app, doctor_app, pharmacy_app, rider_app with 100% clean Dart analyze."
    )

    add_qa_box(
        "7",
        "How does the rider app verify that medicines are handed to the right patient?",
        "Yash Patadiya / Prajapati Riddhi",
        "When an order is dispatched, MediQ generates a cryptographically random 4-digit doorstep OTP stored in the patient's secure session. The EV rider cannot mark the order as 'DELIVERED' until they physically verify and enter this OTP into their terminal, completely eliminating misplaced or stolen deliveries.",
        "Show doorstep OTP verification in ScheduledRiderDeliveryView.jsx and rider_app/lib/main.dart."
    )

    add_qa_box(
        "8",
        "What is the commercial viability and revenue model for MediQ?",
        "Yash Patadiya",
        "MediQ follows a high-margin B2B2C model:\n1. B2B SaaS Subscription: Private clinics and hospitals pay ₹2,500/month per OPD wing for queue pacing, doctor KYC, and analytics.\n2. Hyperlocal Pharmacy Logistics Fee: ₹15–₹35 convenience fee on scheduled EV rider deliveries.\n3. Zero capex for hospitals: Works on existing phones and PCs.",
        "Show SuperAdminPanel.jsx and AdminAnalytics.jsx financial ledgers."
    )

    add_qa_box(
        "9",
        "What if a hospital lobby has poor mobile data or elderly patients without smartphones?",
        "Riya Dhariwal",
        "MediQ supports Front-Desk Reception Walk-In Issuance. The receptionist can issue physical printed slips with a QR code in 5 seconds. Furthermore, our Zero-Login 10-ft TV Display runs continuously in the waiting room without requiring any login credentials, announcing current tokens aloud via browser speech chime.",
        "Show ReceptionDashboard.jsx and PublicDisplay.jsx (?role=tv)."
    )

    add_qa_box(
        "10",
        "How does your generic substitution ensure drug efficacy and safety?",
        "Prajapati Riddhi",
        "Our generic substitution engine does not match arbitrary brands. It indexes the active chemical salt formulation (e.g., 'Amoxicillin 500mg + Clavulanic Acid 125mg') approved under the Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP). Bioequivalence and dosage match 100%, while eliminating private brand marketing markups.",
        "Show generic catalog mapping in PrescriptionOCRView.jsx and pharmacy_marketplace.dart."
    )

    add_qa_box(
        "11",
        "How does your AI Prescription OCR work?",
        "Yash Patadiya",
        "The AI Vision OCR module takes an image upload or camera snapshot of a handwritten prescription, extracts text tokens using high-contrast edge filtering, maps detected drug strings against the Jan Aushadhi pharmacopeia, and pre-populates the medicine cart with generic alternatives.",
        "Show PrescriptionOCRView.jsx in the web console."
    )

    add_qa_box(
        "12",
        "What was your individual contribution versus your teammates?",
        "Each speaks their role",
        "Yash: 'I designed the full-stack system architecture, built the React 19 web console, engineered the Rider Flutter app, and configured Firebase/Razorpay.'\nRiya: 'I led field research, formulated the EWMA pacing engine, built the transit Leave-Now logic, and designed the Flutter Patient app.'\nRiddhi: 'I developed the pharmacy dark-store matching, ACID stock transactions, Jan Aushadhi generic substitution, and ABDM ABHA locker integration.'",
        "Reference Section 2 Team Ownership Matrix."
    )

    doc.add_page_break()

    # =========================================================================
    # 7. HINGLISH & POWER IMPACT PUNCHLINES FOR VIVA
    # =========================================================================
    add_h1("6. Hinglish & Hindi Power Punchlines for Maximum Viva Impact")
    add_p("If the judges ask questions in Hindi or prefer practical conversational answers, use these memorable, high-impact punchlines:", color_rgb=C_GRAY, italic=True)

    hinglish_points = [
        ("Opening Hook", 
         "\"Sir, hamara concept simple hai: India me agar Zomato se khana 15 minute me track ho sakta hai aur Blinkit se grocery 10 minute me aa sakti hai, toh ek bimar patient hospital me 3 ghante metal bench pe kyu baithe? MediQ usi problem ko solve karta hai.\"",
         C_BLUE),
        
        ("Pacing Engine", 
         "\"Doctor ka consultation koi clock machine nahi hai sir. Isiliye humne EWMA mathematical engine banaya jo real-time doctor ki speed samajh kar patient ko bolta hai: 'Aap 10:15 pe ghar se niklo, hospital pahunchte hi aapka number aayega.' Waiting hall ki bheed 85% kam ho gayi!\"",
         C_EMERALD),
        
        ("Generic Saving", 
         "\"Sir, jo antibiotic strip branded pharmacy me ₹220 ki milti hai, wahi same chemical salt Jan Aushadhi me ₹65 me milta hai. MediQ automatically 70.9% paise bachata hai aur EV rider se doorstep pe scheduled slot me deliver karta hai secret OTP ke sath.\"",
         C_AMBER),

        ("Closing Defense", 
         "\"Sir, yeh project sirf theoretical presentation nahi hai. 4 native Flutter mobile apps, live React web console, Cloud Firestore backend aur Razorpay gateway fully functional aur deployed hai. Aap abhi apne phone me test kar sakte hain!\"",
         C_NAVY)
    ]

    for title, quote, color in hinglish_points:
        add_callout(title, quote, speaker="HINDI / HINGLISH CONVERSATIONAL OPTION", bg_color="F8FAFC", border_color="0F172A", title_color=color)

    # Save document
    doc.save(output_path)
    print(f"Master presentation document saved successfully to: {output_path}")

if __name__ == '__main__':
    out_file = sys.argv[1] if len(sys.argv) > 1 else "MediQ_Presentation_Script_Evaluation_Master.docx"
    build_presentation_doc(out_file)
