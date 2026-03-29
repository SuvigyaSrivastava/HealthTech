import type { ChatMessage, ChatContext, ChatIntent, ChatAction, Entity } from '../../../shared/types/chat.types';
import { getMockPatients } from '../../../shared/utils/mockData';

const SUGGESTIONS = [
  'Show high-risk patients',
  'How many patients have diabetes?',
  'Go to analytics',
  'Explain the Second Brain feature',
  'Show critical alerts',
  'List all patients',
];

const RULES: Array<{
  pattern: RegExp;
  intent: ChatIntent;
  respond: (matches: RegExpMatchArray, context: ChatContext) => { content: string; action?: ChatAction };
}> = [
  {
    pattern: /(show|list|find).*high.?risk|critical.*patient/i,
    intent: 'query_patients',
    respond: () => {
      const patients = getMockPatients().filter((p) => ['high', 'critical'].includes(p.riskProfile.overallRiskLevel));
      return {
        content: `Found **${patients.length} high/critical risk patients**.\n\nTop 3:\n${patients.slice(0, 3).map((p, i) => `${i + 1}. ${p.personalInfo.firstName} ${p.personalInfo.lastName} (${p.id}) — Risk: ${p.riskProfile.overallRiskLevel}`).join('\n')}\n\nNavigating to filtered patient list...`,
        action: { type: 'navigate', payload: { to: '/patients?risk=high' } },
      };
    },
  },
  {
    pattern: /how many.*diabetes|diabetes.*patient/i,
    intent: 'query_patients',
    respond: () => {
      const count = getMockPatients().filter((p) =>
        p.medicalInfo.primaryDiagnosis.toLowerCase().includes('diabetes') ||
        p.medicalInfo.chronicConditions.some((c: string) => c.toLowerCase().includes('diabetes'))
      ).length;
      return { content: `There are **${count} patients** with diabetes in the system (including Type 1 and Type 2 diagnoses).` };
    },
  },
  {
    pattern: /(go to|open|show me|navigate to).*analytic/i,
    intent: 'navigation',
    respond: () => ({ content: 'Navigating to the Analytics page...', action: { type: 'navigate', payload: { to: '/analytics' } } }),
  },
  {
    pattern: /(go to|open|show me|navigate to).*dashboard/i,
    intent: 'navigation',
    respond: () => ({ content: 'Navigating to the Dashboard...', action: { type: 'navigate', payload: { to: '/dashboard' } } }),
  },
  {
    pattern: /(go to|open|show me|navigate to).*(patient|people)/i,
    intent: 'navigation',
    respond: () => ({ content: 'Navigating to the Patients page...', action: { type: 'navigate', payload: { to: '/patients' } } }),
  },
  {
    pattern: /(go to|open|show me|navigate to).*(second.?brain|brain)/i,
    intent: 'navigation',
    respond: () => ({ content: 'Navigating to Second Brain...', action: { type: 'navigate', payload: { to: '/second-brain' } } }),
  },
  {
    pattern: /second.?brain|what is second brain|explain.*brain/i,
    intent: 'second_brain_query',
    respond: () => ({
      content: `**Second Brain** is an AI-powered intelligence layer that analyzes patient EHR data to:\n\n• 📅 **Timeline Generation** — Creates chronological medical event timelines\n• 📈 **Change Detection** — Identifies significant changes in labs & vitals in the last 30 days\n• 🚨 **Risk Flag Alerts** — Detects CKD progression, uncontrolled diabetes, metabolic syndrome\n• 🔍 **Pattern Detection** — Finds comorbidity clusters and care gaps\n\nYou can access it via the sidebar or through any patient's detail page.`,
    }),
  },
  {
    pattern: /(find|show|search).*patient\s+(PAT-\d+|\d{5})/i,
    intent: 'query_patients',
    respond: (matches) => {
      const id = matches[2].startsWith('PAT-') ? matches[2] : `PAT-${matches[2]}`;
      const patient = getMockPatients().find((p) => p.id === id);
      if (!patient) return { content: `Could not find patient with ID **${id}**. Please check the ID.` };
      return {
        content: `Found patient **${patient.personalInfo.firstName} ${patient.personalInfo.lastName}** (${id}):\n\n• Risk Level: ${patient.riskProfile.overallRiskLevel}\n• Diagnosis: ${patient.medicalInfo.primaryDiagnosis}\n• Risk Score: ${patient.riskProfile.riskScore}/100`,
        action: { type: 'navigate', payload: { to: `/patients/${id}` } },
      };
    },
  },
  {
    pattern: /total|how many.*patient|patient.*count/i,
    intent: 'query_patients',
    respond: () => {
      const p = getMockPatients();
      return { content: `There are **${p.length} total patients** in the system:\n\n• Low risk: ${p.filter((x) => x.riskProfile.overallRiskLevel === 'low').length}\n• Medium risk: ${p.filter((x) => x.riskProfile.overallRiskLevel === 'medium').length}\n• High risk: ${p.filter((x) => x.riskProfile.overallRiskLevel === 'high').length}\n• Critical: ${p.filter((x) => x.riskProfile.overallRiskLevel === 'critical').length}` };
    },
  },
  {
    pattern: /critical.*(alert|patient)|urgent/i,
    intent: 'query_patients',
    respond: () => {
      const critical = getMockPatients().filter((p) => p.riskProfile.overallRiskLevel === 'critical');
      return { content: `⚠️ **${critical.length} critical patients** require immediate attention:\n\n${critical.slice(0, 5).map((p) => `• ${p.personalInfo.firstName} ${p.personalInfo.lastName} — ${p.medicalInfo.primaryDiagnosis} (Score: ${p.riskProfile.riskScore})`).join('\n')}` };
    },
  },
];

class LocalChatService {
  async sendMessage(userMessage: string, context: ChatContext): Promise<ChatMessage> {
    await new Promise((r) => setTimeout(r, 600)); // Simulate thinking

    for (const rule of RULES) {
      const matches = userMessage.match(rule.pattern);
      if (matches) {
        const { content, action } = rule.respond(matches, context);
        return {
          id: crypto.randomUUID(),
          role: 'assistant',
          content,
          timestamp: new Date(),
          metadata: { intent: rule.intent, action, confidence: 0.85 },
        };
      }
    }

    // Default responses
    const lower = userMessage.toLowerCase();
    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
      return this.buildResponse("Hello! I'm your Healthcare Assistant. How can I help you today? You can ask me about patients, navigate to different sections, or ask about the Second Brain feature.", 'general');
    }
    if (lower.includes('help') || lower.includes('what can you do')) {
      return this.buildResponse(`I can help you with:\n\n• **Patient queries** — "Show high-risk patients", "Find patient PAT-10001"\n• **Navigation** — "Go to analytics", "Open Second Brain"\n• **Data insights** — "How many diabetes patients?", "Show critical alerts"\n• **Feature help** — "Explain Second Brain"\n\nWhat would you like to know?`, 'help');
    }
    if (lower.includes('thank')) {
      return this.buildResponse("You're welcome! Is there anything else I can help you with?", 'general');
    }

    return this.buildResponse(
      "I'm not sure I understand that. Try asking about:\n• Patient counts or risk levels\n• Navigating to a section\n• What the Second Brain does\n\nOr type **help** to see all I can do.",
      'general',
      0.3
    );
  }

  private buildResponse(content: string, intent: ChatIntent, confidence = 0.8): ChatMessage {
    return { id: crypto.randomUUID(), role: 'assistant', content, timestamp: new Date(), metadata: { intent, confidence } };
  }

  getSuggestions(): string[] {
    return SUGGESTIONS;
  }
}

export const chatService = new LocalChatService();
