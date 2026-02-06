---
name: research-assistant
description: Use when conducting research, analysis, or investigation tasks. Provides systematic approach to gathering, organizing, and synthesizing information.
---

# Research Assistant

## Overview

The Research Assistant skill provides a systematic approach to conducting research, analysis, and investigation tasks. It helps organize the research process, validate sources, and synthesize information into actionable insights.

## When to Use

Use this skill when:
- Conducting market research or competitive analysis
- Investigating technical problems or solutions
- Analyzing trends or patterns in data
- Gathering information for decision-making
- Performing academic or business research
- Evaluating technologies or methodologies

## Core Components

### 1. Research Planning
Structured approach to defining research objectives and methodology.

### 2. Source Validation
Techniques for evaluating the credibility and relevance of information sources.

### 3. Information Synthesis
Methods for combining information from multiple sources into coherent insights.

## Implementation

### Step 1: Research Planning
Before beginning research, define the scope and approach:

```markdown
## Research Plan Template

### Objective
[Clear statement of what you're trying to learn/discover]

### Key Questions
- [Primary question 1]
- [Primary question 2]
- [Secondary question 1]
- [Secondary question 2]

### Scope
- Inclusions: [What is covered]
- Exclusions: [What is not covered]
- Timeline: [When research should be completed]
- Resources: [What resources are available]

### Methodology
- Research approaches to be used
- Types of sources to consult
- Tools for organizing information
```

### Step 2: Source Identification & Validation
Systematically identify and evaluate sources:

1. **Source Credibility Assessment**
   - Authority: Who is the author/publisher?
   - Accuracy: Is the information factually correct?
   - Currency: Is the information up-to-date?
   - Coverage: Does it adequately cover the topic?

2. **Source Tracking**
   Maintain a `sources.md` file to track all sources consulted:

```markdown
# Research Sources

## Primary Sources
| Title | Author | Date | Link | Relevance |
|-------|--------|------|------|-----------|
| [Title] | [Author] | [Date] | [Link] | [Brief note on relevance] |

## Secondary Sources
| Title | Author | Date | Link | Relevance |
|-------|--------|------|------|-----------|
| [Title] | [Author] | [Date] | [Link] | [Brief note on relevance] |

## Notes
- [Any additional notes about sources]
```

### Step 3: Information Organization
Organize gathered information systematically:

**findings.md**
```markdown
# Research Findings

## Theme 1: [Topic/Category]
### Key Points
- [Point 1 with source reference]
- [Point 2 with source reference]
- [Point 3 with source reference]

### Contradictions/Discrepancies
- [Note any conflicting information and possible explanations]

## Theme 2: [Topic/Category]
### Key Points
- [Point 1 with source reference]
- [Point 2 with source reference]

### Emerging Patterns
- [Note any patterns that emerge across sources]
```

### Step 4: Synthesis & Analysis
Combine information to form insights:

**analysis.md**
```markdown
# Research Analysis

## Summary of Findings
[Brief summary of the most important findings]

## Implications
### For [Stakeholder/Domain]
- [Implication 1]
- [Implication 2]

### For [Another Stakeholder/Domain]
- [Implication 1]

## Recommendations
Based on the research, the following recommendations are made:

1. [Recommendation 1 with justification]
2. [Recommendation 2 with justification]
3. [Recommendation 3 with justification]

## Limitations
[Any limitations of the research that should be considered]

## Future Research
[Suggestions for additional research that would be valuable]
```

## Best Practices

1. **Systematic Approach**: Follow a consistent methodology for all research
2. **Source Diversity**: Consult multiple types of sources for balanced perspective
3. **Critical Evaluation**: Question information and verify claims when possible
4. **Documentation**: Keep detailed records of sources and findings
5. **Objectivity**: Strive to remain objective and acknowledge bias
6. **Ethics**: Respect copyright and ethical guidelines in research
7. **Verification**: Cross-reference important claims with multiple sources

## Research Techniques

### Lateral Reading
Instead of reading deeply into one source, sample from multiple sources to get a broader perspective.

### Source Comparison
Create tables comparing different sources on key dimensions relevant to your research question.

### Claim Verification
For important claims, trace back to original sources and verify accuracy.

## Tools for Research

### Information Gathering
- Use `web_search` to find relevant sources
- Use `web_fetch` to retrieve specific pages
- Use `grep_search` to find specific information in documents

### Organization
- Use `write_file` to create research artifacts (sources.md, findings.md, etc.)
- Use `read_file` to review previously gathered information
- Use `edit` to update research documents as new information emerges

## Verification

Before completing research, verify:
- All sources are properly documented
- Claims are supported by credible evidence
- Multiple perspectives have been considered
- Analysis is logically sound
- Conclusions follow from the evidence
- Limitations are acknowledged