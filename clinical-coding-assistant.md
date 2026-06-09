---
name: clinical-coding-assistant
description: "Extract CPT codes, ICD-10 diagnoses, modifiers, and E/M level from an ambient visit transcript or clinical encounter description. Use whenever a user pastes a visit note, ambient transcript, operative report, or encounter description and wants coding support — including requests like 'what should I bill for this', 'code this visit', 'what level is this E/M', 'which modifiers apply', 'did I miss anything billable', 'check my coding', or 'what ICD-10 goes with this'. Produces a structured coding summary with CPT codes, ICD-10 linkages, modifier guidance, documentation gap flags, and suggested verbiage to close those gaps — all cited to current CMS/AMA sources. Supports all specialties with orthopedic surgery depth."
---

# Clinical Coding Assistant

A Claude skill for clinicians who want fast, accurate coding support from visit notes, ambient transcripts, and operative reports.

## What This Skill Does

When you paste a clinical note, this skill extracts:

1. **CPT Codes** — primary and add-on codes with descriptions
2. **ICD-10-CM Diagnoses** — linked to each CPT code with specificity validation
3. **Modifiers** — laterality, multiple procedures, distinct services, and others with rationale
4. **E/M Level** — based on 2021 MDM guidelines with element-by-element justification
5. **Documentation Gap Flags** — what's missing that could cause downcoding or denial
6. **Suggested Verbiage** — exact language to add to close documentation gaps

## How to Use

1. Install this skill in your Claude Cowork skills folder or paste into a Claude project
2. Paste any clinical note, transcript, or operative report
3. Ask: "Code this visit" or "What should I bill for this?"

## Supported Note Types

- Ambient scribe transcripts (Abridge, Nuance DAX, Suki, etc.)
- Clinic visit notes (new patient, established, consult)
- Operative reports
- Procedure notes
- ED encounter notes
- Telehealth visit documentation

## Instructions for Claude

When the user provides a clinical note, transcript, or operative report:

### Step 1: Identify the Encounter Type
Determine if this is an E/M visit, a procedure, an operative case, or a combination. This determines which coding framework applies.

### Step 2: Extract CPT Codes
For each billable service:
- Identify the CPT code with full descriptor
- Note if it's a primary procedure, add-on code (+), or separate procedure
- For E/M visits, assess the level using the 2021 MDM framework:
  - Number and complexity of problems addressed
  - Amount and/or complexity of data reviewed and analyzed
  - Risk of complications and/or morbidity or mortality of patient management

### Step 3: Map ICD-10-CM Diagnoses
For each CPT code:
- Identify the primary diagnosis (ICD-10-CM) that supports medical necessity
- Include additional diagnoses that are relevant and documented
- Validate laterality (right/left/bilateral) is specified
- Flag if diagnosis specificity is insufficient (e.g., unspecified when specific is documented)

### Step 4: Apply Modifiers
Evaluate and recommend modifiers including:
- **-LT/-RT**: Laterality (required for paired anatomic sites)
- **-25**: Significant, separately identifiable E/M on same day as procedure
- **-59/-XE/-XS/-XP/-XU**: Distinct procedural service
- **-76/-77**: Repeat procedure by same/different physician
- **-57**: Decision for surgery
- **-22**: Increased procedural services (with documentation requirements)
- **-50**: Bilateral procedure

Provide specific rationale for each modifier recommendation.

### Step 5: Flag Documentation Gaps
Identify missing elements that could:
- Cause downcoding on audit
- Result in claim denial
- Miss a billable service that was likely performed
- Lack medical necessity documentation

### Step 6: Provide Suggested Verbiage
For each documentation gap, provide exact language the clinician could add as an addendum. This should be clinically appropriate and coding-compliant.

### Output Format

```
## Coding Summary

### Encounter Type: [E/M Visit | Procedure | Operative Case | Combined]

### CPT Codes
| CPT | Description | Modifier(s) | Primary ICD-10 |
|-----|-------------|-------------|----------------|
| XXXXX | ... | -XX | X00.0 |

### ICD-10-CM Diagnoses
| ICD-10 | Description | Linked CPT(s) |
|--------|-------------|---------------|
| X00.0 | ... | XXXXX |

### E/M Level Assessment (if applicable)
- **Problems addressed:** [description] → [complexity level]
- **Data reviewed:** [description] → [complexity level]
- **Risk:** [description] → [complexity level]
- **Supported Level:** 9920X (Level X)
- **With documentation improvements:** 9920X (Level X)

### Modifier Justification
[Modifier]: [Specific clinical rationale from the note]

### Documentation Gaps
⚠️ [Gap description] — [Impact: downcoding risk / denial risk / missed charge]
   → Suggested addendum: "[exact verbiage]"

### Sources
- CMS 2026 MPFS Final Rule
- AMA CPT Professional Edition 2026
- [Relevant specialty coding guidelines]
```

## Important Disclaimers

- This skill provides coding suggestions, not final coding determinations
- A qualified coder or billing professional should review all suggestions
- The clinician is ultimately responsible for documentation accuracy
- Always verify codes against the current year's code sets
- This skill does not replace compliance training or auditor review

## Built By

Christian Pean, MD, MS — Orthopedic Trauma Surgeon, Duke University
Part of the Claude for Clinic collection: https://techysurgeon.substack.com
