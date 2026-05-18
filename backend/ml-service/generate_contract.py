from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, 
    Paragraph, 
    Spacer, 
    HRFlowable, 
    Table, 
    TableStyle
)
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY


def create_contract_pdf_v2(buffer):
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2.5*cm,
        leftMargin=2.5*cm,
        topMargin=1*cm,
        bottomMargin=2.5*cm
    )

    story = []

    dark_brown = colors.HexColor('#2D1F14')
    muted = colors.HexColor('#7A5C44')
    light_gray = colors.HexColor('#999999')

    styles = getSampleStyleSheet()

    logo_style = ParagraphStyle(
        "Logo", 
        fontSize=24, 
        fontName="Helvetica-Bold", 
        textColor=dark_brown,
        alignment=TA_CENTER, 
        spaceAfter=20,
    )
    tagline_style = ParagraphStyle(
        "Tagline", 
        fontSize=10, 
        fontName="Helvetica-Oblique", 
        textColor=muted, 
        alignment=TA_CENTER,
        spaceAfter=16
    )
    title_style = ParagraphStyle(
        "Title", 
        fontSize=18, 
        fontName="Helvetica-Bold", 
        textColor=dark_brown, 
        alignment=TA_CENTER, 
        spaceAfter=16
    )
    meta_style = ParagraphStyle(
        "Meta", 
        fontSize=10, 
        fontName="Helvetica", 
        textColor=muted, 
        alignment=TA_CENTER, 
        spaceAfter=16
    )
    section_style = ParagraphStyle(
        "Section", 
        fontSize=11, 
        fontName="Helvetica-Bold", 
        textColor=dark_brown, 
        spaceBefore=16, 
        spaceAfter=8
    )
    body_style = ParagraphStyle(
        "Body", 
        fontSize=10, 
        fontName="Helvetica", 
        textColor=colors.black, 
        spaceAfter=6, 
        leading=14
    )
    clause_style = ParagraphStyle(
        "Clause", 
        fontSize=10, 
        fontName="Helvetica", 
        textColor=colors.black, 
        spaceAfter=8, 
        leading=15, 
        alignment=TA_JUSTIFY
    )
    footer_style = ParagraphStyle(
        "Footer", 
        fontSize=8, 
        fontName="Helvetica-Oblique", 
        textColor=light_gray, 
        alignment=TA_CENTER
    )

    # HEADER
    story.append(Paragraph('PAWS', logo_style))
    story.append(Paragraph('Every stray deserves a front page.', tagline_style))
    story.append(
        HRFlowable(
            width='100%', 
            thickness=1.5, 
            color=dark_brown, 
            spaceAfter=16,
        )
    )

    # TITLE & META
    story.append(Paragraph('ADOPTION AGREEMENT', title_style))
    story.append(Paragraph('Agreement number: ______________________', meta_style))
    story.append(Paragraph('Date: ______________________', meta_style))
    story.append(
        HRFlowable(
            width='100%', 
            thickness=0.5, 
            color=muted, 
            spaceAfter=16
        )
    )

    # PARTIES
    story.append(Paragraph('PARTIES', section_style))

    parties_text = (
        'This Adoption Agreement is entered into between the Transferor / Rescue Representative and the Adopter, both identified below. '
        'The Transferor is the individual who posted the animal for adoption on Paws. The Adopter is the individual who agrees to take custody of the animal described below, under the clauses set forth in this Agreement. '
        'By signing this Agreement, both parties acknowledge that they have read, understood, and agreed to the terms and conditions outlined herein, and that this Agreement is legally binding upon them.'
    )

    story.append(Paragraph(parties_text, clause_style))

    # ADOPTER INFORMATION
    story.append(Paragraph('ADOPTER INFORMATION', section_style))

    adopter_data = [
        ["Full Name", ""],
        ["Personal Identification Number (CNP)", ""],
        ["ID Card Series and Number", ""],
        ["Issued By", ""],
        ["Date of Issue", ""],
        ["Full Address", ""],
        ["Phone Number", ""],
        ["Email Address", ""],
        ["Emergency Contact Name", ""],
        ["Emergency Contact Phone", ""],
        ["Preferred Veterinarian / Clinic", ""],
    ]

    adopter_table = Table(adopter_data, colWidths=[7 * cm, 9 * cm])

    adopter_table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 9.5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("LINEBELOW", (0, 0), (-1, -1), 0.3, light_gray),
                ("LINEBELOW", (1, 0), (1, -1), 0.8, dark_brown),
                ("TEXTCOLOR", (0, 0), (0, -1), dark_brown),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ]
        )
    )

    story.append(adopter_table)

    # ANIMAL INFORMATION
    story.append(Spacer(1, 10))
    story.append(Paragraph('ANIMAL INFORMATION', section_style))

    animal_data = [
        ["Name", ""],
        ["Species", ""],
        ["Breed", ""],
        ["Color", ""],
        ["Sex", ""],
        ["Age / Estimated Date of Birth", ""],
        ["Size / Weight", ""],
        ["Distinctive Features", ""],
        ["Microchip Number", ""],
        ["Passport / Health Booklet Number", ""],
        ["Vaccination Status", ""],
        ["Spayed / Neutered", ""],
        ["Current Medications", ""],
        ["Known Medical Conditions", ""],
        ["Date of Transfer / Adoption", ""],
    ]

    animal_table = Table(animal_data, colWidths=[7 * cm, 9 * cm])

    animal_table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 9.5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("LINEBELOW", (0, 0), (-1, -1), 0.3, light_gray),
                ("LINEBELOW", (1, 0), (1, -1), 0.8, dark_brown),
                ("TEXTCOLOR", (0, 0), (0, -1), dark_brown),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ]
        )
    )

    story.append(animal_table)

    # TERMS & CONDITIONS
    story.append(Spacer(1, 14))
    story.append(
        HRFlowable(
            width='100%', 
            thickness=0.5, 
            color=muted, 
            spaceAfter=10
        )
    )

    story.append(Paragraph("TERMS AND CONDITIONS", section_style))

    intro_text = (
        "The adopter acknowledges that animal ownership is a long-term "
        "responsibility requiring adequate care, housing, nutrition, "
        "supervision, and veterinary attention."
    )

    story.append(Paragraph(intro_text, clause_style))

    clauses = [
        (
            "1. Companion Animal Purpose",
            "The animal shall be kept solely as a companion animal and "
            "shall reside primarily within the adopter's private residence.",
        ),
        (
            "2. Humane Care",
            "The adopter agrees to provide appropriate food, water, shelter, "
            "exercise, affection, and veterinary care at all times.",
        ),
        (
            "3. Veterinary Obligations",
            "The adopter agrees to maintain vaccinations, preventative care, "
            "and treatment for illness or injury as recommended by a licensed veterinarian.",
        ),
        (
            "4. Sterilization Requirement",
            "If the animal has not already been sterilized, the adopter agrees "
            "to spay or neuter the animal within the agreed timeframe.",
        ),
        (
            "5. Transfer Restriction",
            "The animal may not be sold, transferred, gifted, abandoned, "
            "or otherwise rehomed without prior written consent of the Transferor.",
        ),
        (
            "6. Return Policy",
            "If the adopter becomes unable or unwilling to care for the animal, "
            "the animal shall be returned to the Transferor or a licensed animal shelter.",
        ),
        (
            "7. Identification",
            "The adopter agrees to maintain current identification information "
            "for the animal, including collar tags and/or microchip registration.",
        ),
        (
            "8. Prohibited Uses",
            "The animal shall not be used for commercial breeding, experimentation, "
            "guarding, fighting, or any unlawful purpose.",
        ),
        (
            "9. Right of Reclamation",
            "The Transferor reserves the right to reclaim the animal in cases "
            "of neglect, abuse, abandonment, or violation of this Agreement.",
        ),
        (
            "10. Financial Responsibility",
            "The adopter assumes full financial responsibility for the animal "
            "from the date of adoption onward.",
        ),
    ]

    for title, text in clauses:
        story.append(
            Paragraph(
                f"<b>{title}</b><br/>{text}",
                clause_style,
            )
        )

    # DECLARATION
    story.append(Spacer(1, 12))

    story.append(Paragraph("DECLARATION", section_style))

    declaration_text = (
        "By signing this Agreement, the adopter confirms receipt of the animal "
        "described herein and agrees to comply fully with all terms and conditions "
        "contained in this document. Both parties acknowledge that the information "
        "provided is accurate to the best of their knowledge."
    )

    story.append(Paragraph(declaration_text, clause_style))

    # SIGNATURES
    story.append(Spacer(1, 18))

    signature_data = [
        ["ADOPTER"],
        ["Name", ""],
        ["Signature", ""],
        ["Date", ""],
        [""],
        ["TRANSFEROR / RESCUE REPRESENTATIVE"],
        ["Name", ""],
        ["Signature", ""],
        ["Date", ""],
    ]

    signature_table = Table(signature_data, colWidths=[6 * cm, 10 * cm])

    signature_table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("TEXTCOLOR", (0, 0), (0, -1), dark_brown),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("LINEBELOW", (0, 1), (-1, 3), 0.3, light_gray),
                ("LINEBELOW", (0, 6), (-1, 8), 0.3, light_gray),
                ("LINEBELOW", (1, 1), (1, 3), 0.8, dark_brown),  
                ("LINEBELOW", (1, 6), (1, 8), 0.8, dark_brown),
            ]
        )
    )

    story.append(signature_table)

    # FOOTER
    story.append(Spacer(1, 20))

    story.append(
        HRFlowable(
            width="100%",
            thickness=0.5,
            color=light_gray,
            spaceAfter=8,
        )
    )

    story.append(
        Paragraph(
            "PAWS Adoption Services · paws.ro",
            footer_style,
        )
    )

    doc.build(story)
